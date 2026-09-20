from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Event, EventMember, Photo, Gallery
from app.schemas import (
    EventCreate, EventMemberAdd, EventOut, EventMemberOut,
    PhotoPresignRequest, PhotoPresignResponse,
    PhotoConfirmRequest, PhotoOut
)
from app.dependencies import get_current_user, require_admin, verify_event_access
from app.s3 import generate_presigned_upload_url, get_photo_url

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    POST /events (Admin only)
    Creates a new event and automatically assigns admin user.
    """
    event_id = data.custom_id or data.name.lower().replace(" ", "-").replace("/", "-")
    existing = db.query(Event).filter(Event.id == event_id).first()
    if existing:
        # Append unique suffix if event id exists
        import uuid
        event_id = f"{event_id}-{uuid.uuid4().hex[:6]}"

    event = Event(
        id=event_id,
        name=data.name,
        created_by=admin_user.id
    )
    db.add(event)
    db.commit()

    # Automatically add admin creator to event members
    member = EventMember(event_id=event.id, user_id=admin_user.id)
    db.add(member)
    db.commit()
    db.refresh(event)

    return _format_event_out(event, db)

@router.post("/{id}/members", response_model=EventMemberOut, status_code=status.HTTP_201_CREATED)
def add_event_member(
    id: str,
    data: EventMemberAdd,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    POST /events/{id}/members (Admin only)
    Adds a team member to an event.
    """
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    target_user = None
    if data.user_id:
        target_user = db.query(User).filter(User.id == data.user_id).first()
    elif data.email:
        target_user = db.query(User).filter(User.email == data.email).first()

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing_membership = db.query(EventMember).filter(
        EventMember.event_id == id,
        EventMember.user_id == target_user.id
    ).first()

    if existing_membership:
        return EventMemberOut(id=existing_membership.id, user_id=target_user.id, email=target_user.email)

    membership = EventMember(event_id=id, user_id=target_user.id)
    db.add(membership)
    db.commit()
    db.refresh(membership)

    return EventMemberOut(id=membership.id, user_id=target_user.id, email=target_user.email)

@router.get("", response_model=List[EventOut])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /events
    Lists events accessible by current user.
    Admin gets all events. Team members get events they are assigned to.
    """
    if current_user.role == "admin":
        events = db.query(Event).order_by(Event.created_at.desc()).all()
    else:
        assigned_event_ids = db.query(EventMember.event_id).filter(
            EventMember.user_id == current_user.id
        ).all()
        ids = [e[0] for e in assigned_event_ids]
        events = db.query(Event).filter(Event.id.in_(ids)).order_by(Event.created_at.desc()).all()

    return [_format_event_out(e, db) for e in events]

@router.get("/{id}", response_model=EventOut)
def get_event(
    id: str,
    event: Event = Depends(verify_event_access),
    db: Session = Depends(get_db)
):
    """
    GET /events/{id}
    Returns event details. Enforces admin or assigned team member access (403 otherwise).
    """
    return _format_event_out(event, db)

@router.post("/{id}/photos/presign", response_model=PhotoPresignResponse)
def presign_photo_upload(
    id: str,
    data: PhotoPresignRequest,
    event: Event = Depends(verify_event_access),
    current_user: User = Depends(get_current_user)
):
    """
    POST /events/{id}/photos/presign (Team member / Admin assigned to event)
    Generates an S3 presigned upload URL. File bytes never traverse backend.
    """
    res = generate_presigned_upload_url(filename=data.filename, event_id=id)
    return res

@router.post("/{id}/photos/confirm", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
def confirm_photo_upload(
    id: str,
    data: PhotoConfirmRequest,
    event: Event = Depends(verify_event_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    POST /events/{id}/photos/confirm (Team member / Admin assigned to event)
    Saves metadata after successful S3 upload. Rolls back on error.
    """
    try:
        photo = Photo(
            event_id=id,
            uploaded_by=current_user.id,
            filename=data.filename,
            storage_key=data.storage_key,
            file_size=data.file_size
        )
        db.add(photo)
        db.commit()
        db.refresh(photo)

        return PhotoOut(
            id=photo.id,
            event_id=photo.event_id,
            uploaded_by=photo.uploaded_by,
            filename=photo.filename,
            storage_key=photo.storage_key,
            file_size=photo.file_size,
            url=get_photo_url(photo.storage_key),
            created_at=photo.created_at
        )
    except Exception as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save photo metadata: {str(err)}"
        )

@router.get("/{id}/photos", response_model=List[PhotoOut])
def list_event_photos(
    id: str,
    event: Event = Depends(verify_event_access),
    db: Session = Depends(get_db)
):
    """
    GET /events/{id}/photos
    Returns all uploaded photos for review by Admin / assigned team members.
    """
    photos = db.query(Photo).filter(Photo.event_id == id).order_by(Photo.created_at.desc()).all()
    out = []
    for p in photos:
        out.append(
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
    return out

def _format_event_out(event: Event, db: Session) -> EventOut:
    photo_count = db.query(Photo).filter(Photo.event_id == event.id).count()
    gallery = db.query(Gallery).filter(Gallery.event_id == event.id, Gallery.is_published == True).first()

    members_out = []
    for m in event.members:
        u = db.query(User).filter(User.id == m.user_id).first()
        members_out.append(
            EventMemberOut(
                id=m.id,
                user_id=m.user_id,
                email=u.email if u else None
            )
        )

    return EventOut(
        id=event.id,
        name=event.name,
        created_by=event.created_by,
        created_at=event.created_at,
        members=members_out,
        photo_count=photo_count,
        is_published=gallery.is_published if gallery else False,
        published_pin=None,  # Plaintext PIN is never returned in list endpoints
        share_slug=gallery.share_slug if gallery else None
    )
