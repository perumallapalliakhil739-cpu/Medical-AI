"""System metadata and configuration information schemas."""

from typing import List, Dict, Any
from pydantic import BaseModel, Field


class SystemInfoResponse(BaseModel):
    name: str
    version: str
    environment: str
    database_engine: str
    allowed_file_types: List[str]
    max_upload_size_mb: int
    safety_boundaries: Dict[str, Any]
    safety_disclaimer: str
