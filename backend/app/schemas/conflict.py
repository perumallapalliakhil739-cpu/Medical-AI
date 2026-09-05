"""
Pydantic schemas for Conflict & Inconsistency Detection (Step 7).
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class ConflictResponse(BaseModel):
    """Structured conflict or discrepancy alert."""
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    source_report_a_id: str
    source_report_a_title: Optional[str] = None
    source_report_b_id: Optional[str] = None
    source_report_b_title: Optional[str] = None
    conflict_type: str
    severity: str
    description: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConflictResolvePayload(BaseModel):
    """Payload for resolving a detected clinical inconsistency."""
    resolution_notes: str = Field(..., min_length=3, description="Clinician documented resolution rationale")
    action: str = Field(default="resolved", description="'resolved' or 'dismissed'")
