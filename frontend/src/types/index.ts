/**
 * TypeScript domain types and API contract interfaces for MedLens.
 */

export interface DatabaseHealth {
  status: 'connected' | 'error' | 'unexpected_result';
  engine: string;
  dialect: string;
  latency_ms: number;
  error?: string | null;
}

export interface StorageHealth {
  status: string;
  upload_directory: string;
  writable: boolean;
  max_upload_size_mb: number;
}

export interface SafetyProtocol {
  autonomous_diagnosis_allowed: boolean;
  medication_prescription_allowed: boolean;
  dosage_alteration_allowed: boolean;
  treatment_protocol_generation_allowed: boolean;
  healthcare_provider_replacement_allowed: boolean;
  human_in_the_loop_required: boolean;
  provenance_tracking_enforced: boolean;
}

export interface HealthResponse {
  status: 'ok' | 'healthy' | 'degraded' | 'error';
  service?: string;
  application: string;
  version: string;
  environment: string;
  timestamp: string;
  database: DatabaseHealth;
  storage: StorageHealth;
  safety_protocol: SafetyProtocol;
  safety_disclaimer: string;
}

export interface SystemInfoResponse {
  name: string;
  version: string;
  environment: string;
  database_engine: string;
  allowed_file_types: string[];
  max_upload_size_mb: number;
  safety_boundaries: SafetyProtocol;
  safety_disclaimer: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | null;
  };
}

export type UserRole = 'clinician' | 'admin' | 'auditor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  account_status: string;
  institution?: string;
  license_number?: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: User;
}

export type SourceLabel =
  | 'User Provided'
  | 'Imported'
  | 'Extracted from Report'
  | 'AI Generated'
  | 'AI Calculated'
  | 'Human Verified';

export interface Patient {
  id: string;
  patient_identifier: string;
  name: string;
  date_of_birth?: string | null;
  age?: number | null;
  sex: string;
  contact_information?: string | null;
  symptoms?: string | null;
  medical_conditions?: string | null;
  allergies?: string | null;
  current_medications?: string | null;
  relevant_medical_history?: string | null;
  family_history?: string | null;
  other_information?: string | null;
  field_sources?: string | null; // JSON string
  created_by_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  name: string;
  patient_identifier?: string;
  date_of_birth?: string;
  age?: number;
  sex?: string;
  contact_information?: string;
  symptoms?: string;
  medical_conditions?: string;
  allergies?: string;
  current_medications?: string;
  relevant_medical_history?: string;
  family_history?: string;
  other_information?: string;
  field_sources?: string;
}

export interface PatientUpdate {
  name?: string;
  patient_identifier?: string;
  date_of_birth?: string;
  age?: number;
  sex?: string;
  contact_information?: string;
  symptoms?: string;
  medical_conditions?: string;
  allergies?: string;
  current_medications?: string;
  relevant_medical_history?: string;
  family_history?: string;
  other_information?: string;
  field_sources?: string;
}

export interface PatientListResponse {
  items: Patient[];
  total: number;
  page: number;
  size: number;
}

export interface LabResult {
  id: string;
  report_id: string;
  patient_id?: string | null;
  test_name: string;
  analyte_code?: string | null;
  raw_value: string;
  numeric_value?: number | null;
  unit?: string | null;
  reference_range?: string | null;
  reference_range_source?: string | null;
  flag?: 'normal' | 'low' | 'high' | 'critical' | 'unspecified';
  confidence_score?: number | null;
  source_type: SourceLabel;
  source_document?: string | null;
  provenance_page?: number | null;
  provenance_bbox?: string | null;
  extraction_method: string;
  report_date?: string | null;
  verification_status: 'pending' | 'verified' | 'corrected' | 'rejected';
  verified_by_user_id?: string | null;
  correction_notes?: string | null;
  original_ai_value?: string | null;
  observation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalReport {
  id: string;
  patient_id?: string | null;
  title: string;
  report_type: string;
  source_filename: string;
  file_size_bytes: number;
  mime_type: string;
  report_date?: string | null;
  status: 'uploaded' | 'processing' | 'extracted' | 'verified' | 'error';
  verification_status: 'pending' | 'verified' | 'corrected' | 'rejected';
  extraction_confidence?: number | null;
  extracted_text?: string | null;
  ai_summary?: string | null;
  checksum: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  lab_results?: LabResult[];
}

export interface ReportListResponse {
  items: MedicalReport[];
  total: number;
  page: number;
  size: number;
}

export interface VerificationQueueItem {
  id: string;
  report_id: string;
  report_title: string;
  patient_id?: string | null;
  patient_name?: string | null;
  test_name: string;
  raw_value: string;
  unit?: string | null;
  reference_range?: string | null;
  flag?: 'normal' | 'low' | 'high' | 'critical' | 'unspecified';
  confidence_score?: number | null;
  source_document?: string | null;
  verification_status: string;
  correction_notes?: string | null;
  original_ai_value?: string | null;
  observation?: string | null;
  created_at: string;
}

export interface Conflict {
  id: string;
  patient_id: string;
  patient_name?: string | null;
  source_report_a_id: string;
  source_report_a_title?: string | null;
  source_report_b_id?: string | null;
  source_report_b_title?: string | null;
  conflict_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'detected' | 'acknowledged' | 'resolved' | 'dismissed';
  resolution_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  patient_id: string;
  source_report_id?: string | null;
  source_report_title?: string | null;
  event_date: string;
  event_type: string;
  title: string;
  summary?: string | null;
  facility?: string | null;
  clinician_name?: string | null;
  created_at: string;
}

export interface ComparisonItem {
  test_name: string;
  unit: string;
  previous_value: string;
  previous_numeric?: number | null;
  previous_flag?: string | null;
  previous_reference?: string | null;
  current_value: string;
  current_numeric?: number | null;
  current_flag?: string | null;
  current_reference?: string | null;
  change?: number | null;
  percent_change?: number | null;
  trend: 'increased' | 'decreased' | 'stable' | 'new';
  observation: string;
}

export interface ReportComparisonData {
  current_report: {
    id: string;
    title: string;
    date?: string | null;
    type: string;
  };
  previous_report: {
    id: string;
    title: string;
    date?: string | null;
    type: string;
  };
  comparisons: ComparisonItem[];
  historical_series: Array<{
    report_id: string;
    title: string;
    date: string;
    values: Record<string, number>;
  }>;
  clinical_disclaimer: string;
}

export interface SystemSettings {
  app_name: string;
  tagline: string;
  theme_color: string;
  confidence_threshold_high: number;
  confidence_threshold_medium: number;
  supported_file_types: string[];
  ai_summary_instructions: string;
  feature_toggles: {
    patient_intake: boolean;
    report_upload: boolean;
    ai_summary: boolean;
    conflict_detection: boolean;
    comparison: boolean;
    timeline: boolean;
    export: boolean;
    side_by_side: boolean;
  };
}
