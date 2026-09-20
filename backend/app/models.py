import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Table
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="team_member") # "admin" or "team_member"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    created_events = relationship("Event", back_populates="creator")
    event_memberships = relationship("EventMember", back_populates="user", cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="uploader")

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="created_events")
    members = relationship("EventMember", back_populates="event", cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="event", cascade="all, delete-orphan")
    galleries = relationship("Gallery", back_populates="event", cascade="all, delete-orphan")

class EventMember(Base):
    __tablename__ = "event_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    event = relationship("Event", back_populates="members")
    user = relationship("User", back_populates="event_memberships")

class Photo(Base):
    __tablename__ = "photos"

    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    storage_key = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    event = relationship("Event", back_populates="photos")
    uploader = relationship("User", back_populates="photos")
    gallery_photos = relationship("GalleryPhoto", back_populates="photo", cascade="all, delete-orphan")

class Gallery(Base):
    __tablename__ = "galleries"

    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    pin_hash = Column(String, nullable=False)
    share_slug = Column(String, unique=True, index=True, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    published_at = Column(DateTime, default=datetime.utcnow, nullable=True)

    event = relationship("Event", back_populates="galleries")
    gallery_photos = relationship("GalleryPhoto", back_populates="gallery", cascade="all, delete-orphan")

class GalleryPhoto(Base):
    __tablename__ = "gallery_photos"

    id = Column(String, primary_key=True, default=generate_uuid)
    gallery_id = Column(String, ForeignKey("galleries.id"), nullable=False)
    photo_id = Column(String, ForeignKey("photos.id"), nullable=False)

    gallery = relationship("Gallery", back_populates="gallery_photos")
    photo = relationship("Photo", back_populates="gallery_photos")
