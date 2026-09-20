from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, events, galleries

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LUMEN Photo Sharing Platform API",
    description="Editorial photo-sharing platform backend for event teams with curated galleries, S3 upload presigning, and PIN access.",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(galleries.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "name": "LUMEN API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Mock S3 upload endpoint for local testing without AWS S3 credentials
@app.put("/api/v1/mock-s3-upload/{storage_key:path}")
def mock_s3_upload(storage_key: str):
    """
    Mock PUT endpoint for S3 upload simulations in local environment.
    """
    return Response(status_code=status.HTTP_200_OK)
