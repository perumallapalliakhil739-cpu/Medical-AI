# MedLens API Reference

## Base Endpoints

| Environment | Base URL |
|---|---|
| **Development** | `http://localhost:8000/api/v1` |
| **Interactive OpenAPI Docs** | `http://localhost:8000/docs` |
| **ReDoc Specification** | `http://localhost:8000/redoc` |

---

## 1. Health & Operational Telemetry

### `GET /api/v1/health`

Validates backend operational readiness, PostgreSQL connectivity, local storage write access, and safety protocol status.

#### Response Headers:
```http
X-MedLens-Safety-Notice: Assistive clinical intelligence only; no diagnosis or prescription
X-MedLens-Human-In-The-Loop: required
Content-Type: application/json
```

#### Response Body (200 OK):
```json
{
  "status": "ok",
  "service": "MedLens API",
  "application": "MedLens — AI-Powered Clinical Information Intelligence",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-09-05T06:15:32.412150+00:00",
  "database": {
    "status": "connected",
    "engine": "PostgreSQL 16+",
    "dialect": "postgresql",
    "latency_ms": 1.42,
    "error": null
  },
  "storage": {
    "status": "ready",
    "upload_directory": "../uploads",
    "writable": true,
    "max_upload_size_mb": 25
  },
  "safety_protocol": {
    "autonomous_diagnosis_allowed": false,
    "medication_prescription_allowed": false,
    "dosage_alteration_allowed": false,
    "treatment_protocol_generation_allowed": false,
    "healthcare_provider_replacement_allowed": false,
    "human_in_the_loop_required": true,
    "provenance_tracking_enforced": true
  },
  "safety_disclaimer": "MedLens is an assistive clinical information intelligence platform and does NOT formulate medical diagnoses or treatment recommendations."
}
```

---

## 2. System Information

### `GET /api/v1/system/info`

Returns system configurations, file upload limits, supported file extensions, and safety policies.

#### Response Body (200 OK):
```json
{
  "name": "MedLens — AI-Powered Clinical Information Intelligence",
  "version": "0.1.0",
  "environment": "development",
  "database_engine": "PostgreSQL 16+",
  "allowed_file_types": [".pdf", ".txt", ".json", ".xml", ".csv", ".png", ".jpg", ".jpeg"],
  "max_upload_size_mb": 25,
  "safety_boundaries": {
    "autonomous_diagnosis_allowed": false,
    "medication_prescription_allowed": false,
    "human_in_the_loop_required": true
  },
  "safety_disclaimer": "MedLens is strictly an assistive information organization tool."
}
```

---

## 3. Error Structure

All errors follow a uniform JSON structure without exposing internal Python stack traces:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted clinical data failed validation constraints.",
    "details": [
      {
        "field": "body -> report_id",
        "message": "Field required"
      }
    ]
  }
}
```
