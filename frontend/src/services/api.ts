import {
  HealthResponse,
  SystemInfoResponse,
  ApiErrorResponse,
  Patient,
  PatientCreate,
  PatientUpdate,
  PatientListResponse,
  MedicalReport,
  ReportListResponse,
  LabResult,
  VerificationQueueItem,
  Conflict,
  TimelineEvent,
  ReportComparisonData,
  SystemSettings,
  User,
  AuthResponse
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Global bearer token store
 */
let authToken: string | null = localStorage.getItem('medlens_auth_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('medlens_auth_token', token);
  } else {
    localStorage.removeItem('medlens_auth_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  // Only set Content-Type to JSON if body is not FormData
  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    throw new ApiError(
      'Unable to establish connection with MedLens backend. Ensure the server is running.',
      'NETWORK_FAILURE',
      0,
      networkError.message
    );
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch {
      // Body not JSON
    }

    if (response.status === 422) {
      throw new ApiError(
        errorData?.error?.message || 'Submitted clinical data failed validation constraints.',
        'VALIDATION_FAILURE',
        422,
        errorData?.error?.details
      );
    }

    if (response.status === 401) {
      throw new ApiError(
        errorData?.error?.message || 'Unauthorized: Please authenticate to access clinical records.',
        'UNAUTHORIZED',
        401,
        errorData?.error?.details
      );
    }

    if (response.status >= 500) {
      throw new ApiError(
        errorData?.error?.message || 'MedLens backend encountered an internal error.',
        'BACKEND_FAILURE',
        response.status,
        errorData?.error?.details
      );
    }

    throw new ApiError(
      errorData?.error?.message || `Request failed with HTTP status ${response.status}`,
      errorData?.error?.code || `HTTP_${response.status}`,
      response.status,
      errorData?.error?.details
    );
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (parseError: any) {
    return text as unknown as T;
  }
}

// -------------------------------------------------------------
// Diagnostics & Core API
// -------------------------------------------------------------
export async function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health');
}

export async function fetchSystemInfo(): Promise<SystemInfoResponse> {
  return apiRequest<SystemInfoResponse>('/system/info');
}

// -------------------------------------------------------------
// Authentication API (Step 17)
// -------------------------------------------------------------
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.access_token) {
    setAuthToken(res.access_token);
  }
  return res;
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}

// -------------------------------------------------------------
// Patient Registry API (Step 2 & 15)
// -------------------------------------------------------------
export async function fetchPatients(search?: string, page: number = 1, size: number = 50): Promise<PatientListResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', String(page));
  params.append('size', String(size));
  return apiRequest<PatientListResponse>(`/patients?${params.toString()}`);
}

export async function getPatient(id: string): Promise<Patient> {
  return apiRequest<Patient>(`/patients/${id}`);
}

export async function createPatient(data: PatientCreate): Promise<Patient> {
  return apiRequest<Patient>('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePatient(id: string, data: PatientUpdate): Promise<Patient> {
  return apiRequest<Patient>(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePatient(id: string): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/patients/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Medical Reports API (Step 3 & 4)
// -------------------------------------------------------------
export async function fetchReports(patientId?: string): Promise<ReportListResponse> {
  const endpoint = patientId ? `/reports?patient_id=${patientId}` : '/reports';
  return apiRequest<ReportListResponse>(endpoint);
}

export async function getReport(reportId: string): Promise<MedicalReport> {
  return apiRequest<MedicalReport>(`/reports/${reportId}`);
}

export async function uploadReport(formData: FormData): Promise<MedicalReport> {
  return apiRequest<MedicalReport>('/reports/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function reprocessReport(reportId: string): Promise<MedicalReport> {
  return apiRequest<MedicalReport>(`/reports/${reportId}/reprocess`, {
    method: 'POST',
  });
}

export async function updateLabResult(
  reportId: string,
  resultId: string,
  payload: {
    test_name?: string;
    raw_value?: string;
    unit?: string;
    reference_range?: string;
    correction_notes?: string;
  }
): Promise<LabResult> {
  return apiRequest<LabResult>(`/reports/${reportId}/results/${resultId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteReport(reportId: string): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/reports/${reportId}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Human Verification Center API (Step 8 & 14)
// -------------------------------------------------------------
export async function fetchVerificationQueue(
  statusFilter?: string,
  patientId?: string
): Promise<VerificationQueueItem[]> {
  const params = new URLSearchParams();
  if (statusFilter) params.append('status_filter', statusFilter);
  if (patientId) params.append('patient_id', patientId);
  return apiRequest<VerificationQueueItem[]>(`/verification/queue?${params.toString()}`);
}

export async function acceptVerificationItem(resultId: string): Promise<any> {
  return apiRequest(`/verification/results/${resultId}/accept`, {
    method: 'POST',
  });
}

export async function editVerificationItem(
  resultId: string,
  payload: {
    corrected_value: string;
    corrected_unit?: string;
    corrected_range?: string;
    correction_notes: string;
  }
): Promise<any> {
  return apiRequest(`/verification/results/${resultId}/edit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function rejectVerificationItem(resultId: string, reason: string): Promise<any> {
  return apiRequest(`/verification/results/${resultId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: reason }),
  });
}

export async function verifyEntireReport(reportId: string): Promise<any> {
  return apiRequest(`/verification/reports/${reportId}/verify-all`, {
    method: 'POST',
  });
}

// -------------------------------------------------------------
// Conflict Detection API (Step 7)
// -------------------------------------------------------------
export async function fetchConflicts(patientId?: string, statusFilter?: string): Promise<Conflict[]> {
  const params = new URLSearchParams();
  if (patientId) params.append('patient_id', patientId);
  if (statusFilter) params.append('status_filter', statusFilter);
  return apiRequest<Conflict[]>(`/conflicts?${params.toString()}`);
}

export async function resolveConflict(
  conflictId: string,
  notes: string,
  action: 'resolved' | 'dismissed' = 'resolved'
): Promise<Conflict> {
  return apiRequest<Conflict>(`/conflicts/${conflictId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolution_notes: notes, action }),
  });
}

// -------------------------------------------------------------
// Patient Chronological Timeline API (Step 11)
// -------------------------------------------------------------
export async function fetchPatientTimeline(
  patientId: string,
  eventType?: string,
  order: 'asc' | 'desc' = 'desc'
): Promise<TimelineEvent[]> {
  const params = new URLSearchParams();
  if (eventType) params.append('event_type', eventType);
  params.append('order', order);
  return apiRequest<TimelineEvent[]>(`/timeline/${patientId}?${params.toString()}`);
}

// -------------------------------------------------------------
// Report Comparison API (Step 10)
// -------------------------------------------------------------
export async function fetchReportComparison(
  currentReportId: string,
  previousReportId: string
): Promise<ReportComparisonData> {
  return apiRequest<ReportComparisonData>(
    `/comparison?current_report_id=${currentReportId}&previous_report_id=${previousReportId}`
  );
}

// -------------------------------------------------------------
// Responsible AI API (Step 9 & 20)
// -------------------------------------------------------------
export async function fetchAiSummary(params: { report_id?: string; patient_id?: string }): Promise<{
  source_type: string;
  summary: string;
  guardrail_notice: string;
}> {
  return apiRequest('/ai/summary', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// -------------------------------------------------------------
// System Settings API (Step 24)
// -------------------------------------------------------------
export async function fetchSettings(): Promise<SystemSettings> {
  return apiRequest<SystemSettings>('/settings');
}

export async function updateSettings(payload: Partial<SystemSettings>): Promise<SystemSettings> {
  return apiRequest<SystemSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// -------------------------------------------------------------
// Synthetic Demo Data Seeder (Step 27)
// -------------------------------------------------------------
export async function seedDemoData(): Promise<any> {
  return apiRequest('/seed/demo-data', {
    method: 'POST',
  });
}

export async function checkDemoStatus(): Promise<{
  is_seeded: boolean;
  patient_count: number;
  report_count: number;
  conflict_count: number;
  pending_verifications: number;
}> {
  return apiRequest('/seed/status');
}
