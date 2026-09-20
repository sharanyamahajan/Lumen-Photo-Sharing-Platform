import uuid
import boto3
from botocore.config import Config
from app.config import settings

def get_s3_client():
    kwargs = {
        "service_name": "s3",
        "region_name": settings.AWS_REGION,
        "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
        "config": Config(signature_version="s3v4")
    }
    if settings.S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
    return boto3.client(**kwargs)

def generate_presigned_upload_url(filename: str, event_id: str) -> dict:
    ext = filename.split(".")[-1] if "." in filename else "jpg"
    storage_key = f"events/{event_id}/{uuid.uuid4().hex}.{ext}"

    try:
        if settings.AWS_ACCESS_KEY_ID == "mock_access_key":
            # Development / mock fallback URL for local testing without S3
            upload_url = f"http://localhost:8000/api/v1/mock-s3-upload/{storage_key}"
        else:
            s3_client = get_s3_client()
            upload_url = s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": storage_key,
                },
                ExpiresIn=3600
            )
    except Exception:
        upload_url = f"http://localhost:8000/api/v1/mock-s3-upload/{storage_key}"

    return {
        "upload_url": upload_url,
        "storage_key": storage_key
    }

def get_photo_url(storage_key: str) -> str:
    if not storage_key:
        return ""
    if storage_key.startswith("http://") or storage_key.startswith("https://"):
        return storage_key

    try:
        if settings.AWS_ACCESS_KEY_ID == "mock_access_key":
            return f"https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80"
        s3_client = get_s3_client()
        return s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": storage_key
            },
            ExpiresIn=3600 * 24
        )
    except Exception:
        return f"https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80"
