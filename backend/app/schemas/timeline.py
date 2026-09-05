"""
Pydantic schemas for Patient Timeline (Step 11).
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class TimelineEventCreate(BaseModel):
    """Payload for registering a clinical timeline event."""
    patient_id: str
    event_date: datetime
    event_type: str = Field(default="clinical_note", description="lab_test, radiology, clinical_note, consultation, prescription")
    title: str = Field(..., min_length=2, max_length=255)
    summary: Optional[str] = None
    facility: Optional[str] = None
    clinician_name: Optional[str] = None
    source_report_id: Optional[str] = None


class TimelineEventResponse(BaseModel):
    """Structured clinical timeline event."""
    id: str
    patient_id: str
    source_report_id: Optional[str] = None
    source_report_title: Optional[str] = None
    event_date: datetime
    event_type: str
    title: str
    summary: Optional[str] = None
    facility: Optional[str] = None
    clinician_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
