-- ==============================================================================
-- MedLens — AI-Powered Clinical Information Intelligence
-- PostgreSQL Initialization Script
-- ==============================================================================

-- Enable UUID extension for secure, non-sequential clinical resource identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for future fast clinical term and report text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create clinical schema namespaces if needed
CREATE SCHEMA IF NOT EXISTS clinical;
CREATE SCHEMA IF NOT EXISTS audit;

-- System status probe table for database health validation and audit logging
CREATE TABLE IF NOT EXISTS system_status (
    id VARCHAR(64) PRIMARY KEY,
    status VARCHAR(32) NOT NULL,
    environment VARCHAR(32) NOT NULL DEFAULT 'development',
    version VARCHAR(32) NOT NULL,
    safety_protocol_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial system status record
INSERT INTO system_status (id, status, environment, version, safety_protocol_active)
VALUES ('medlens-core', 'operational', 'development', '0.1.0', TRUE)
ON CONFLICT (id) DO UPDATE 
SET updated_at = CURRENT_TIMESTAMP;

-- Foundation table for Patient registry
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrn VARCHAR(64) UNIQUE, -- Medical Record Number (anonymized/tokenized identifier)
    anonymous_id VARCHAR(64) NOT NULL UNIQUE,
    age INTEGER,
    gender VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Foundation table for Medical Reports
CREATE TABLE IF NOT EXISTS medical_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(64) NOT NULL, -- e.g. pathology, radiology, lab, discharge_summary
    source_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'uploaded', -- uploaded, queued, processing, indexed, error
    checksum VARCHAR(64) NOT NULL, -- SHA-256 integrity hash
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_anonymous_id ON patients(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient_id ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_status ON medical_reports(status);
CREATE INDEX IF NOT EXISTS idx_medical_reports_created_at ON medical_reports(created_at DESC);
