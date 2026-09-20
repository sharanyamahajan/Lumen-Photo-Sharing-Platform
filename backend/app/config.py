import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lumen.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-lumen-jwt-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # S3 Settings
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "lumen-photo-archive")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "mock_access_key")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "mock_secret_key")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_ENDPOINT_URL: str | None = os.getenv("S3_ENDPOINT_URL", None)

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
