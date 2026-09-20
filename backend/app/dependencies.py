from time import time
from typing import Dict, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth import security, decode_access_token
from app.database import get_db
from app.models import User, Event, EventMember

# In-memory sliding window rate limiter for gallery PIN attempts per slug
# Maps slug -> List of timestamp floats
_PIN_ATTEMPTS: Dict[str, List[float]] = {}

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication payload"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists"
        )
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

def verify_event_access(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Event:
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Admin role can access any event
    if current_user.role == "admin":
        return event

    # Check if team member is explicitly assigned in event_members table
    is_member = db.query(EventMember).filter(
        EventMember.event_id == id,
        EventMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access this event's data"
        )

    return event

def enforce_pin_rate_limit(slug: str):
    """
    Enforces rate limit: Maximum 5 attempts per minute per slug.
    """
    now = time()
    window = 60.0  # 60 seconds
    max_attempts = 5

    attempts = _PIN_ATTEMPTS.get(slug, [])
    # Filter out timestamps older than window
    attempts = [t for t in attempts if now - t < window]

    if len(attempts) >= max_attempts:
        _PIN_ATTEMPTS[slug] = attempts
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded: Maximum 5 PIN verification attempts per minute. Please wait."
        )

    attempts.append(now)
    _PIN_ATTEMPTS[slug] = attempts
