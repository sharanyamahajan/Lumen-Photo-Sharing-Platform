import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Event, Photo, Gallery, GalleryPhoto
from app.schemas import (
    GalleryCreateRequest, GalleryCreateResponse,
    GalleryAccessRequest, PublicGalleryOut, PhotoOut
)
from app.auth import hash_pin, verify_pin
from app.dependencies import get_current_user, require_admin, enforce_pin_rate_limit
from app.s3 import get_photo_url

router = APIRouter(tags=["Galleries"])

@router.post("/galleries", response_model=GalleryCreateResponse, status_code=status.HTTP_201_CREATED)
def create_gallery(
    data: GalleryCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    POST /galleries (Admin only)
    Creates gallery for an event, takes photo_ids, generates random 6-digit PIN,
    hashes PIN with bcrypt before storing, sets is_published=True,
    and returns plaintext PIN ONCE.
    """
    event = db.query(Event).filter(Event.id == data.event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if not data.photo_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one photo ID must be selected to publish gallery"
        )

    # Verify all photo_ids belong to the event
    valid_photos = db.query(Photo).filter(Photo.id.in_(data.photo_ids), Photo.event_id == data.event_id).all()
    if len(valid_photos) != len(set(data.photo_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more photo IDs are invalid for this event"
        )

    # Determine unique share_slug
    share_slug = data.share_slug or event.id
    existing_gallery = db.query(Gallery).filter(Gallery.share_slug == share_slug).first()

    # Generate random 6-digit PIN
    random_pin = f"{random.randint(100000, 999999)}"
    pin_hashed = hash_pin(random_pin)

    if existing_gallery:
        # Update existing gallery
        existing_gallery.pin_hash = pin_hashed
        existing_gallery.is_published = True
        existing_gallery.published_at = datetime.utcnow()

        # Re-populate gallery photos
        db.query(GalleryPhoto).filter(GalleryPhoto.gallery_id == existing_gallery.id).delete()
        for p in valid_photos:
            gp = GalleryPhoto(gallery_id=existing_gallery.id, photo_id=p.id)
            db.add(gp)
        db.commit()
        db.refresh(existing_gallery)
        gallery_obj = existing_gallery
    else:
        # Create new gallery
        gallery_obj = Gallery(
            event_id=data.event_id,
            pin_hash=pin_hashed,
            share_slug=share_slug,
            is_published=True,
            published_at=datetime.utcnow()
        )
        db.add(gallery_obj)
        db.commit()
        db.refresh(gallery_obj)

        for p in valid_photos:
            gp = GalleryPhoto(gallery_id=gallery_obj.id, photo_id=p.id)
            db.add(gp)
        db.commit()

    return GalleryCreateResponse(
        id=gallery_obj.id,
        event_id=gallery_obj.event_id,
        share_slug=gallery_obj.share_slug,
        pin=random_pin,  # Returned ONCE in plaintext
        is_published=gallery_obj.is_published,
        published_at=gallery_obj.published_at
    )

@router.get("/gallery/{slug}", response_model=PublicGalleryOut)
def get_public_gallery(
    slug: str,
    x_gallery_pin: Optional[str] = Header(None, alias="X-Gallery-PIN"),
    pin: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    GET /gallery/{slug} (Public PIN-protected)
    Rate-limited to 5 attempts/minute per slug.
    Returns 404 if gallery is unpublished or does not exist.
    Verifies PIN against bcrypt hash at rest.
    Returns only photos in gallery_photos.
    """
    # 1. Enforce rate limit (5 attempts / min)
    enforce_pin_rate_limit(slug)

    # 2. Query gallery by share_slug
    gallery = db.query(Gallery).filter(Gallery.share_slug == slug).first()
    if not gallery or not gallery.is_published:
        # Unpublished galleries return 404
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found or unavailable"
        )

    # 3. Extract provided PIN from header or query param
    provided_pin = x_gallery_pin or pin
    if not provided_pin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Gallery access PIN is required"
        )

    # 4. Verify PIN against bcrypt hash
    if not verify_pin(provided_pin, gallery.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid gallery access PIN"
        )

    # 5. Fetch selected photos in gallery_photos
    gallery_photo_records = db.query(GalleryPhoto).filter(GalleryPhoto.gallery_id == gallery.id).all()
    photo_ids = [gp.photo_id for gp in gallery_photo_records]
    photos = db.query(Photo).filter(Photo.id.in_(photo_ids)).all()

    photo_outs = []
    for p in photos:
        photo_outs.append(
            PhotoOut(
                id=p.id,
                event_id=p.event_id,
                uploaded_by=p.uploaded_by,
                filename=p.filename,
                storage_key=p.storage_key,
                file_size=p.file_size,
                url=get_photo_url(p.storage_key),
                created_at=p.created_at
            )
        )

    event = db.query(Event).filter(Event.id == gallery.event_id).first()

    return PublicGalleryOut(
        gallery_id=gallery.id,
        share_slug=gallery.share_slug,
        event_name=event.name if event else "Exhibition Gallery",
        published_at=gallery.published_at,
        photos=photo_outs
    )
