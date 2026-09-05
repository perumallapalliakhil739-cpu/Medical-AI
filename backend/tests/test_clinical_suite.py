"""
Comprehensive automated tests for MedLens Clinical Information Intelligence.
Verifies reference-range awareness, conflict detection, human verification,
report comparison, patient timeline, and export capabilities.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.services.reference_range import evaluate_reference_range
from app.core.security import create_access_token


from app.database.session import SessionLocal
from app.models.user import User


def get_auth_headers():
    """Generate valid test bearer token using seeded clinician."""
    with SessionLocal() as db:
        user = db.query(User).first()
        user_id = user.id if user else "test-clinician-id"
        email = user.email if user else "dr.watson@medlens.org"
        name = user.full_name if user else "Dr. Watson"

    token = create_access_token(
        subject=user_id,
        extra_claims={"email": email, "role": "clinician", "name": name}
    )
    return {"Authorization": f"Bearer {token}"}


def test_reference_range_strict_awareness():
    """Step 5: Verify strict reference range evaluation and zero-hallucination policy."""
    # 1. Normal range check
    flag, norm_range, _ = evaluate_reference_range(13.2, "13.0 - 17.0")
    assert flag == "normal"
    assert norm_range == "13.0 - 17.0"

    # 2. High range check
    flag, _, _ = evaluate_reference_range(126.0, "70 - 100")
    assert flag == "high"

    # 3. Low range check
    flag, _, _ = evaluate_reference_range(55.0, "70-100")
    assert flag == "low"

    # 4. Strict handling when reference range is MISSING: Never hallucinate!
    flag, missing_range, _ = evaluate_reference_range(45.0, None)
    assert flag == "unspecified"
    assert missing_range == "Reference Range: Not provided in source report"

    flag, empty_range, _ = evaluate_reference_range(80.0, "")
    assert flag == "unspecified"
    assert empty_range == "Reference Range: Not provided in source report"


def test_patients_list_and_profile():
    """Step 2: Verify patient registry contains seeded synthetic records."""
    with TestClient(app) as client:
        headers = get_auth_headers()
        res = client.get("/api/v1/patients", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 3
        patient_names = [p["name"] for p in data["items"]]
        assert "Sarah Jenkins" in patient_names
        assert "Robert Chen" in patient_names


def test_reports_and_structured_lab_results():
    """Step 3 & 4: Verify medical reports and structured test records."""
    with TestClient(app) as client:
        headers = get_auth_headers()
        res = client.get("/api/v1/reports", headers=headers)
        assert res.status_code == 200
        reports = res.json()["items"]
        assert len(reports) >= 4

        # Inspect first report
        first_rep_id = reports[0]["id"]
        detail_res = client.get(f"/api/v1/reports/{first_rep_id}", headers=headers)
        assert detail_res.status_code == 200
        rep_data = detail_res.json()
        assert len(rep_data["lab_results"]) > 0
        assert rep_data["extraction_confidence"] is not None
        assert len(rep_data["checksum"]) >= 32


def test_verification_queue_and_human_edit():
    """Step 8: Verify Human Verification Center queue, edit, and accept."""
    with TestClient(app) as client:
        headers = get_auth_headers()
        # 1. Fetch review queue
        q_res = client.get("/api/v1/verification/queue", headers=headers)
        assert q_res.status_code == 200
        items = q_res.json()

        # Find a pending item to edit
        if items:
            item_id = items[0]["id"]
            # Correct value with clinician notes
            edit_payload = {
                "corrected_value": "13.4",
                "corrected_unit": "g/dL",
                "corrected_range": "13.0-17.0",
                "correction_notes": "Corrected based on high-resolution source document scan."
            }
            edit_res = client.post(
                f"/api/v1/verification/results/{item_id}/edit",
                json=edit_payload,
                headers=headers
            )
            assert edit_res.status_code == 200
            assert edit_res.json()["status"] == "corrected"
            assert edit_res.json()["result"]["raw_value"] == "13.4"
            assert edit_res.json()["result"]["original_ai_value"] is not None


def test_conflicts_detection_and_resolution():
    """Step 7: Verify automated conflict detection and human resolution."""
    with TestClient(app) as client:
        headers = get_auth_headers()
        conf_res = client.get("/api/v1/conflicts", headers=headers)
        assert conf_res.status_code == 200
        conflicts = conf_res.json()
        assert len(conflicts) >= 1

        # Check that age mismatch or allergy conflict is present
        types = [c["conflict_type"] for c in conflicts]
        assert any("mismatch" in t or "conflict" in t for t in types)

        # Resolve first conflict
        target_id = conflicts[0]["id"]
        resolve_res = client.post(
            f"/api/v1/conflicts/{target_id}/resolve",
            json={"resolution_notes": "Demographic verified with patient government ID.", "action": "resolved"},
            headers=headers
        )
        assert resolve_res.status_code == 200
        assert resolve_res.json()["status"] == "resolved"


def test_report_comparison():
    """Step 10: Verify current vs previous report comparison and numerical deltas."""
    with TestClient(app) as client:
        headers = get_auth_headers()
        reports_res = client.get("/api/v1/reports", headers=headers)
        reports = reports_res.json()["items"]

        # Find two reports for the same patient (e.g., Sarah Jenkins or Maria Rodriguez)
        patient_reports = {}
        for r in reports:
            pid = r.get("patient_id")
            if pid:
                patient_reports.setdefault(pid, []).append(r["id"])

        paired_pid = next((pid for pid, r_ids in patient_reports.items() if len(r_ids) >= 2), None)
        assert paired_pid is not None

        curr_id, prev_id = patient_reports[paired_pid][0], patient_reports[paired_pid][1]
        comp_res = client.get(
            f"/api/v1/comparison?current_report_id={curr_id}&previous_report_id={prev_id}",
            headers=headers
        )
        assert comp_res.status_code == 200
        comp_data = comp_res.json()
        assert "comparisons" in comp_data
        assert "clinical_disclaimer" in comp_data


def test_export_endpoints():
    """Step 23: Verify CSV, JSON, and printable HTML clinical exports."""
    with TestClient(app) as client:
        headers = get_auth_headers()
        pat_res = client.get("/api/v1/patients", headers=headers)
        pat_id = pat_res.json()["items"][0]["id"]

        # 1. Test CSV export
        csv_res = client.get(f"/api/v1/export/patient/{pat_id}/csv", headers=headers)
        assert csv_res.status_code == 200
        assert "text/csv" in csv_res.headers["content-type"]
        assert "Test Name" in csv_res.text

        # 2. Test JSON export
        json_res = client.get(f"/api/v1/export/patient/{pat_id}/json", headers=headers)
        assert json_res.status_code == 200
        assert "application/json" in json_res.headers["content-type"]
        assert "structured_lab_records" in json_res.json()

        # 3. Test HTML summary sheet export
        html_res = client.get(f"/api/v1/export/patient/{pat_id}/html", headers=headers)
        assert html_res.status_code == 200
        assert "text/html" in html_res.headers["content-type"]
        assert "MedLens Clinical Summary" in html_res.text


def test_settings_retrieval_and_update():
    """Step 24: Verify settings and feature toggles."""
    with TestClient(app) as client:
        headers = get_auth_headers()
        get_res = client.get("/api/v1/settings", headers=headers)
        assert get_res.status_code == 200
        settings = get_res.json()
        assert settings["app_name"] == "MedLens"
        assert settings["feature_toggles"]["patient_intake"] is True

        # Update confidence threshold
        put_res = client.put(
            "/api/v1/settings",
            json={"confidence_threshold_high": 0.92},
            headers=headers
        )
        assert put_res.status_code == 200
        assert put_res.json()["confidence_threshold_high"] == 0.92
