import sys
import os
from datetime import datetime

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import User, Event, EventMember, Photo, Gallery, GalleryPhoto
from app.auth import hash_password, hash_pin

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("\n========================================================")
        print("SEEDING LUMEN DATABASE FOR EVALUATION...")
        print("========================================================\n")

        # 1. Create Demo Admin Account
        admin_email = "admin@lumen.ch"
        admin_password = "AdminSecret123!"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                id="usr-admin-1",
                email=admin_email,
                password_hash=hash_password(admin_password),
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        print(f"[+] DEMO ADMIN CREDENTIALS:")
        print(f"   - Email:    {admin_email}")
        print(f"   - Password: {admin_password}")
        print(f"   - Role:     admin\n")

        # 2. Create Demo Team Member Account
        team_email = "team@lumen.ch"
        team_password = "TeamSecret123!"
        team = db.query(User).filter(User.email == team_email).first()
        if not team:
            team = User(
                id="usr-team-1",
                email=team_email,
                password_hash=hash_password(team_password),
                role="team_member"
            )
            db.add(team)
            db.commit()
            db.refresh(team)

        print(f"[+] DEMO TEAM MEMBER CREDENTIALS:")
        print(f"   - Email:    {team_email}")
        print(f"   - Password: {team_password}")
        print(f"   - Role:     team_member\n")

        # 3. Create Demo Event with Team Member Assigned
        event_id = "solarium-archive"
        event_name = "The Solarium Archive"
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            event = Event(
                id=event_id,
                name=event_name,
                created_by=admin.id
            )
            db.add(event)
            db.commit()

            # Assign both Admin and Team Member
            db.add(EventMember(event_id=event_id, user_id=admin.id))
            db.add(EventMember(event_id=event_id, user_id=team.id))
            db.commit()

        # 4. Seed 6 High Quality Royalty-Free Sample Photos
        sample_photos = [
            ("p-pub-1", "Plinths & Alabaster Forms", "photos/solarium-archive/p-pub-1.jpg", 54000000),
            ("p-pub-2", "Window Profile in Charcoal Wool", "photos/solarium-archive/p-pub-2.jpg", 68000000),
            ("p-pub-3", "Champagne on Limestone", "photos/solarium-archive/p-pub-3.jpg", 48000000),
            ("p-pub-4", "Vaulted Dialogue", "photos/solarium-archive/p-pub-4.jpg", 72000000),
            ("p-pub-5", "Portrait in Chiaroscuro", "photos/solarium-archive/p-pub-5.jpg", 61000000),
            ("p-pub-6", "Brutalist Passage Silhouettes", "photos/solarium-archive/p-pub-6.jpg", 85000000),
        ]

        photo_ids = []
        for p_id, p_name, p_key, p_size in sample_photos:
            existing_p = db.query(Photo).filter(Photo.id == p_id).first()
            if not existing_p:
                p = Photo(
                    id=p_id,
                    event_id=event_id,
                    uploaded_by=team.id,
                    filename=f"{p_name}.jpg",
                    storage_key=p_key,
                    file_size=p_size
                )
                db.add(p)
                db.commit()
                photo_ids.append(p_id)
            else:
                photo_ids.append(existing_p.id)

        # 5. Create Published Gallery with Fixed Known PIN 7721
        gallery_slug = "solarium-archive"
        known_pin = "7721"
        existing_gallery = db.query(Gallery).filter(Gallery.share_slug == gallery_slug).first()

        if not existing_gallery:
            gallery = Gallery(
                id="gal-solarium-1",
                event_id=event_id,
                pin_hash=hash_pin(known_pin),
                share_slug=gallery_slug,
                is_published=True,
                published_at=datetime.utcnow()
            )
            db.add(gallery)
            db.commit()

            for pid in photo_ids:
                db.add(GalleryPhoto(gallery_id=gallery.id, photo_id=pid))
            db.commit()

        print(f"[+] DEMO PUBLISHED GALLERY:")
        print(f"   - Gallery Slug: solarium-archive")
        print(f"   - Gallery PIN:  {known_pin}")
        print(f"   - Local URL:    http://localhost:3000/access/{gallery_slug}")
        print("\n========================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
