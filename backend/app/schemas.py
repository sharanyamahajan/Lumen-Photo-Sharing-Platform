from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")
    role: str = Field("team_member", description="Role: 'admin' or 'team_member'")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Member Schemas
class EventMemberAdd(BaseModel):
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None

class EventMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    email: Optional[str] = None

# Event Schemas
class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Event name cannot be empty")
    custom_id: Optional[str] = None

class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    created_by: str
    created_at: datetime
    members: List[EventMemberOut] = []
    photo_count: int = 0
    is_published: bool = False
    published_pin: Optional[str] = None
    share_slug: Optional[str] = None

# Photo Schemas
class PhotoPresignRequest(BaseModel):
    filename: str = Field(..., min_length=1)
    file_size: int = Field(..., gt=0)

class PhotoPresignResponse(BaseModel):
    upload_url: str
    storage_key: str

class PhotoConfirmRequest(BaseModel):
    filename: str = Field(..., min_length=1)
    storage_key: str = Field(..., min_length=1)
    file_size: int = Field(..., gt=0)

class PhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    uploaded_by: str
    filename: str
    storage_key: str
    file_size: int
    url: str
    created_at: datetime

# Gallery Schemas
class GalleryCreateRequest(BaseModel):
    event_id: str
    photo_ids: List[str] = Field(..., min_length=1, description="At least one photo must be selected to publish gallery")
    share_slug: Optional[str] = None

class GalleryCreateResponse(BaseModel):
    id: str
    event_id: str
    share_slug: str
    pin: str  # Returned ONCE in plaintext upon creation
    is_published: bool
    published_at: datetime

class GalleryAccessRequest(BaseModel):
    pin: str = Field(..., min_length=1, description="6-digit PIN required to access private gallery")

class PublicGalleryOut(BaseModel):
    gallery_id: str
    share_slug: str
    event_name: str
    published_at: datetime
    photos: List[PhotoOut]
