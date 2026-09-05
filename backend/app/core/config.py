"""
Application Configuration and Settings Management for MedLens.
"""

from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Metadata
    APP_NAME: str = "MedLens — AI-Powered Clinical Information Intelligence"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Network / Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "dev-secret-key-for-medlens-do-not-use-in-production-123456789"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Database Configuration
    DATABASE_URL: str = "postgresql+psycopg://medlens_user:medlens_password@localhost:5432/medlens_db"
    SQLITE_FALLBACK_URL: str = "sqlite:///../database/medlens.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    AUTO_FALLBACK_SQLITE: bool = True

    # Storage & Uploads
    UPLOAD_DIR: str = "../uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_FILE_EXTENSIONS: List[str] = [
        ".pdf", ".txt", ".json", ".xml", ".csv", ".png", ".jpg", ".jpeg"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            return json.loads(v)
        return v

    @property
    def resolved_upload_dir(self) -> Path:
        """Resolve upload directory path relative to current working directory or app root."""
        base_dir = Path(__file__).resolve().parent.parent.parent
        resolved = (base_dir / self.UPLOAD_DIR).resolve()
        resolved.mkdir(parents=True, exist_ok=True)
        return resolved

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
