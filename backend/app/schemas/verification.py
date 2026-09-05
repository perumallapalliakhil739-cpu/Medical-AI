"""
Pydantic schemas for Human Verification Center (Step 8).
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.report import LabResultResponse


class VerificationQueueItem(BaseModel):
    """Item in human review queue."""
    id: str
    report_id: str
    report_title: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    test_name: str
    raw_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    flag: Optional[str] = "unspecified"
    confidence_score: Optional[float] = None
    source_document: Optional[str] = None
    verification_status: str
    correction_notes: Optional[str] = None
    original_ai_value: Optional[str] = None
    observation: Optional[str] = None
    created_at: datetime


class VerificationEditPayload(BaseModel):
    """Payload for correcting an extracted lab item in verification center."""
    corrected_value: str = Field(..., description="Clinician corrected value")
    corrected_unit: Optional[str] = None
    corrected_range: Optional[str] = None
    correction_notes: str = Field(..., description="Mandatory clinician rationale/note for correction")


class VerificationRejectPayload(BaseModel):
    """Payload for rejecting an erroneous AI extraction."""
    rejection_reason: str = Field(..., description="Rationale for rejecting extraction")


class VerificationActionResponse(BaseModel):
    """Confirmation of verification action."""
    status: str
    message: str
    result: LabResultResponse
