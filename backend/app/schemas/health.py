"""Health check Pydantic schemas."""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "connected"})
    engine: str = Field(..., json_schema_extra={"example": "PostgreSQL 16+"})
    dialect: str = Field(..., json_schema_extra={"example": "postgresql"})
    latency_ms: float = Field(..., json_schema_extra={"example": 1.42})
    error: Optional[str] = None


class StorageHealth(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "ready"})
    upload_directory: str
    writable: bool
    max_upload_size_mb: int


class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "ok"})
    service: str = Field(default="MedLens API", json_schema_extra={"example": "MedLens API"})
    application: str = Field(..., json_schema_extra={"example": "MedLens — AI-Powered Clinical Information Intelligence"})
    version: str = Field(..., json_schema_extra={"example": "0.1.0"})
    environment: str = Field(..., json_schema_extra={"example": "development"})
    timestamp: str
    database: DatabaseHealth
    storage: StorageHealth
    safety_protocol: Dict[str, Any]
    safety_disclaimer: str
