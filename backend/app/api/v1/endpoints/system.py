"""
System information and metadata endpoints.
"""

from fastapi import APIRouter
from app.core.config import settings
from app.core.safety import CLINICAL_SAFETY_DISCLAIMER, SAFETY_BOUNDARIES
from app.database.session import active_db_type
from app.schemas.system import SystemInfoResponse

router = APIRouter()


@router.get(
    "/system/info",
    response_model=SystemInfoResponse,
    summary="Platform System Information",
    description="Returns platform configuration, enabled database engine, allowed mime types, and safety disclaimers."
)
def get_system_info() -> SystemInfoResponse:
    return SystemInfoResponse(
        name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        database_engine=active_db_type,
        allowed_file_types=settings.ALLOWED_FILE_EXTENSIONS,
        max_upload_size_mb=settings.MAX_UPLOAD_SIZE_MB,
        safety_boundaries=SAFETY_BOUNDARIES,
        safety_disclaimer=CLINICAL_SAFETY_DISCLAIMER
    )
