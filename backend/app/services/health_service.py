"""
Health and diagnostic service for MedLens.
Aggregates connectivity telemetry for PostgreSQL, local disk storage, and clinical safety compliance.
"""

import os
from datetime import datetime, timezone
from app.core.config import settings
from app.core.safety import CLINICAL_SAFETY_DISCLAIMER, SAFETY_BOUNDARIES
from app.database.session import test_database_connection
from app.schemas.health import HealthResponse, DatabaseHealth, StorageHealth


class HealthService:
    """Provides system diagnostics and connectivity telemetry."""

    @staticmethod
    def get_system_health() -> HealthResponse:
        """Evaluate database, storage, and safety configuration."""
        db_result = test_database_connection()
        db_health = DatabaseHealth(
            status=db_result["status"],
            engine=db_result["engine"],
            dialect=db_result["dialect"],
            latency_ms=db_result["latency_ms"],
            error=db_result["error"]
        )

        upload_path = settings.resolved_upload_dir
        writable = os.access(upload_path, os.W_OK)
        storage_health = StorageHealth(
            status="ready" if writable else "readonly_or_inaccessible",
            upload_directory=str(upload_path),
            writable=writable,
            max_upload_size_mb=settings.MAX_UPLOAD_SIZE_MB
        )

        overall_status = "ok" if db_health.status == "connected" and writable else "degraded"

        return HealthResponse(
            status=overall_status,
            service="MedLens API",
            application=settings.APP_NAME,
            version=settings.APP_VERSION,
            environment=settings.APP_ENV,
            timestamp=datetime.now(timezone.utc).isoformat(),
            database=db_health,
            storage=storage_health,
            safety_protocol=SAFETY_BOUNDARIES,
            safety_disclaimer=CLINICAL_SAFETY_DISCLAIMER
        )
