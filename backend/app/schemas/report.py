"""
Pydantic schemas for medical reports and laboratory results.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class LabResultResponse(BaseModel):
    """Structured laboratory result item."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    report_id: str
    patient_id: Optional[str] = None
    test_name: str
    analyte_code: Optional[str] = None
    raw_value: str
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    reference_range_source: Optional[str] = None
    flag: Optional[str] = "unspecified"
    confidence_score: Optional[float] = None
    source_type: str = "Extracted from Report"
    source_document: Optional[str] = None
    provenance_page: Optional[int] = 1
    provenance_bbox: Optional[str] = None
    extraction_method: str = "Clinical NLP"
    report_date: Optional[str] = None
    verification_status: str = "pending"
    verified_by_user_id: Optional[str] = None
    correction_notes: Optional[str] = None
    original_ai_value: Optional[str] = None
    observation: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LabResultUpdate(BaseModel):
    """Payload for editing an extracted lab result."""
    test_name: Optional[str] = None
    raw_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    correction_notes: Optional[str] = None


class ReportResponse(BaseModel):
    """Medical report response model."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: Optional[str] = None
    title: str
    report_type: str
    source_filename: str
    file_size_bytes: int
    mime_type: str
    report_date: Optional[str] = None
    status: str
    verification_status: str
    extraction_confidence: Optional[float] = None
    extracted_text: Optional[str] = None
    ai_summary: Optional[str] = None
    checksum: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    lab_results: List[LabResultResponse] = Field(default_factory=list)


class ReportListResponse(BaseModel):
    """Paginated list of reports."""
    items: List[ReportResponse]
    total: int
    page: int
    size: int
