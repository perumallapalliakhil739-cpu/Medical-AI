"""
Health and status check route for MedLens API.
"""

from fastapi import APIRouter, status
from app.schemas.health import HealthResponse
from app.services.health_service import HealthService

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="MedLens Operational Health Check",
    description="Validates FastAPI backend operational status, live database connectivity, storage readiness, and safety policy status."
)
def get_health() -> HealthResponse:
    """Return health diagnostic payload."""
    return HealthService.get_system_health()
