"""
Automated tests for MedLens Health, Diagnostics, and Safety endpoints.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import test_database_connection as check_db_conn
from app.core.safety import CLINICAL_SAFETY_DISCLAIMER


def test_database_direct_connection():
    """Verify SQLAlchemy engine executes query without error."""
    result = check_db_conn()
    assert result["status"] == "connected", f"Database failed: {result}"
    assert result["latency_ms"] >= 0


def test_root_endpoint():
    """Verify root endpoint returns application metadata and disclaimer."""
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "MedLens" in data["application"]
        assert data["service"] == "MedLens API"
        assert data["safety_boundaries"]["autonomous_diagnosis_allowed"] is False
        assert "X-MedLens-Safety-Notice" in response.headers


def test_health_check_endpoint():
    """Verify /api/v1/health returns HTTP 200, status ok, and MedLens API service."""
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        # Verify required response fields
        assert data["status"] in ["ok", "healthy"]
        assert data["service"] == "MedLens API"
        assert "MedLens" in data["application"]
        assert data["database"]["status"] == "connected"
        assert data["storage"]["writable"] is True
        assert data["safety_disclaimer"] == CLINICAL_SAFETY_DISCLAIMER
        assert "X-MedLens-Safety-Notice" in response.headers


def test_error_handling_no_stacktrace():
    """Verify 404 and structured error handling without leaking stack traces."""
    with TestClient(app) as client:
        response = client.get("/api/v1/non-existent-endpoint")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]
        # Ensure raw stack traces are not leaked
        assert "Traceback" not in response.text
