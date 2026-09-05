# MedLens Database Schema & Model Blueprint

## Overview

MedLens uses PostgreSQL managed by SQLAlchemy 2.0 and Alembic. The foundation includes 8 core architectural entity models prepared for Step 1 through Step 9.

---

## Architectural Models

### 1. `users`
- **Purpose**: System operators, clinicians, and auditors for Step 2 authentication and RBAC.
- **Fields**:
  - `id`: UUID Primary Key (String 36)
  - `email`: Unique indexed email (String 255)
  - `hashed_password`: Argon2/bcrypt hash (String 255)
  - `full_name`: Practitioner's name (String 255)
  - `role`: Role string (`clinician`, `auditor`, `admin`)
  - `license_number`: Medical license string (Nullable)
  - `institution`: Affiliated hospital or clinic (Nullable)
  - `is_active`: Boolean status flag
  - `is_verified`: Identity verification flag
  - `created_at` / `updated_at`: Timestamps

### 2. `patients`
- **Purpose**: Anonymized patient demographic shell ensuring HIPAA compliance.
- **Fields**:
  - `id`: UUID Primary Key (String 36)
  - `mrn`: Hospital Medical Record Number (Nullable, unique)
  - `anonymous_id`: De-identified internal hash (Indexed, unique)
  - `age`: Patient age (Nullable Integer)
  - `gender`: Recorded clinical gender (Nullable String)
  - `created_at` / `updated_at`: Timestamps

### 3. `medical_reports`
- **Purpose**: Uploaded clinical documents, pathology reports, lab panels, and imaging summaries.
- **Fields**:
  - `id`: UUID Primary Key (String 36)
  - `patient_id`: Foreign Key to `patients.id`
  - `title`: Report title
  - `report_type`: Clinical classification (`pathology`, `radiology`, `lab`, `discharge`)
  - `source_filename`: Original file name
  - `file_path`: Storage location
  - `file_size_bytes`: Document byte size
  - `mime_type`: MIME format (`application/pdf`, `image/png`, etc.)
  - `status`: Document ingestion lifecycle status (`uploaded`, `processing`, `extracted`, `verified`)
  - `checksum`: SHA-256 integrity hash
  - `created_at` / `updated_at`: Timestamps

### 4. `lab_results`
- **Purpose**: Structured clinical laboratory test values, units, and ranges extracted with provenance.
- **Fields**:
  - `id`: UUID Primary Key (String 36)
  - `report_id`: Foreign Key to `medical_reports.id`
  - `test_name`: Laboratory analyte name (e.g. Hemoglobin A1c, Serum Potassium)
  - `analyte_code`: LOINC / standardized test code
  - `raw_value`: Exact verbatim string from source document
  - `numeric_value`: Parsed floating-point value
  - `unit`: Measurement unit (e.g. mg/dL, mmol/L)
  - `reference_range`: Normal reference range from source report
  - `flag`: Clinical deviation indicator (`normal`, `low`, `high`, `critical`)
  - `confidence_score`: AI entity extraction confidence score (0.00 – 1.00)
  - `provenance_page`: Document page index
  - `provenance_bbox`: Bounding box coordinates

### 5. `verification_records`
- **Purpose**: Clinician sign-off and human-in-the-loop review records.
- **Fields**:
  - `id`: UUID Primary Key (String 36)
  - `report_id`: Foreign Key to `medical_reports.id`
  - `verified_by_user_id`: Foreign Key to `users.id`
  - `status`: Verification status (`pending_review`, `clinician_verified`, `rejected`)
  - `verification_notes`: Freeform clinician clinical notes
  - `signature_hash`: Cryptographic practitioner sign-off hash
  - `verified_at`: Verification timestamp

### 6. `conflicts`
- **Purpose**: Inter-report discrepancies and chronological contradictions.
- **Fields**:
  - `id`: UUID Primary Key (String 36)
  - `patient_id`: Foreign Key to `patients.id`
  - `source_report_a_id`: Foreign Key to `medical_reports.id`
  - `source_report_b_id`: Foreign Key to `medical_reports.id` (Nullable)
  - `conflict_type`: Classification (`value_discrepancy`, `date_anomaly`, `medication_mismatch`)
  - `severity`: Discrepancy severity (`low`, `medium`, `high`, `critical`)
  - `description`: Clinically descriptive conflict narrative
  - `status`: Resolution state (`detected`, `acknowledged`, `resolved`, `dismissed`)

### 7. `timeline_events`
- **Purpose**: Longitudinal patient timeline organizing clinical encounters chronologically.
- **Fields**:
  - `id`: UUID Primary Key (String 36)
  - `patient_id`: Foreign Key to `patients.id`
  - `source_report_id`: Foreign Key to `medical_reports.id`
  - `event_date`: Chronological encounter date
  - `event_type`: Category (`lab_test`, `radiology`, `consultation`)
  - `title`: Summary headline
  - `summary`: Clinical event narrative

### 8. `audit_logs`
- **Purpose**: Immutable security and HIPAA audit trail.
- **Fields**:
  - `id`: UUID Primary Key (String 36)
  - `user_id`: Acting user (Nullable)
  - `action`: Audit action (`VIEW`, `EXPORT`, `VERIFY`, `MODIFY`)
  - `entity_type`: Target entity class (`patient`, `report`, `lab_result`)
  - `entity_id`: Target entity ID
  - `ip_address`: Request IP
  - `created_at`: Immutable timestamp
