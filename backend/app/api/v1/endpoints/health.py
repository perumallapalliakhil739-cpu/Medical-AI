"""
Health check and diagnostic endpoint for MedLens.
"""

from fastapi import APIRouter, status
from app.schemas.health import HealthResponse
from app.services.health_service import HealthService

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Comprehensive Health Check",
    description="Validates FastAPI backend operational status, live database connectivity, storage readiness, and safety policy status."
)
def get_health() -> HealthResponse:
    """Evaluate database, storage, and safety configuration."""
    return HealthService.get_system_health()
