"""
Patient entity Pydantic schemas for MedLens.
Ensures rigorous input validation for clinical records with per-field provenance tracking.
"""

from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, field_validator


class PatientCreate(BaseModel):
    """Payload for registering a new clinical patient."""
    name: str = Field(..., min_length=2, max_length=255, description="Full patient legal name")
    patient_identifier: Optional[str] = Field(default=None, max_length=64, description="Custom or external MRN identifier")
    date_of_birth: Optional[str] = Field(default=None, max_length=32, description="Date of birth formatted as YYYY-MM-DD")
    age: Optional[int] = Field(default=None, ge=0, le=140, description="Patient chronological age in years")
    sex: str = Field(default="Not Specified", max_length=32, description="Biological sex / gender designation")
    contact_information: Optional[str] = Field(default=None, max_length=255, description="Phone, email, or contact notes")
    symptoms: Optional[str] = Field(default=None, description="Primary complaints, signs, and reported symptoms")
    medical_conditions: Optional[str] = Field(default=None, description="Known prior clinical conditions and diagnoses from medical history")
    allergies: Optional[str] = Field(default=None, description="Known adverse drug reactions and environmental allergies")
    current_medications: Optional[str] = Field(default=None, description="Current prescription drugs, supplements, and dosages verbatim from patient record")
    relevant_medical_history: Optional[str] = Field(default=None, description="Past surgeries, hospitalizations, or chronic illness history")
    family_history: Optional[str] = Field(default=None, description="Relevant familial genetic or chronic conditions")
    other_information: Optional[str] = Field(default=None, description="Relevant clinical observations, triage notes, or additional context")
    field_sources: Optional[str] = Field(default=None, description="JSON mapping field names to provenance sources")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Patient name must contain at least 2 characters")
        return v

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, v: str) -> str:
        v = v.strip()
        if not v:
            return "Not Specified"
        return v


class PatientUpdate(BaseModel):
    """Payload for updating an existing clinical patient."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    patient_identifier: Optional[str] = Field(default=None, max_length=64)
    date_of_birth: Optional[str] = Field(default=None, max_length=32)
    age: Optional[int] = Field(default=None, ge=0, le=140)
    sex: Optional[str] = Field(default=None, max_length=32)
    contact_information: Optional[str] = None
    symptoms: Optional[str] = None
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    relevant_medical_history: Optional[str] = None
    family_history: Optional[str] = None
    other_information: Optional[str] = None
    field_sources: Optional[str] = None


class PatientResponse(BaseModel):
    """Structured patient profile response."""
    id: str
    patient_identifier: str
    name: str
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    sex: str
    contact_information: Optional[str] = None
    symptoms: Optional[str] = None
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    relevant_medical_history: Optional[str] = None
    family_history: Optional[str] = None
    other_information: Optional[str] = None
    field_sources: Optional[str] = None
    created_by_user_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PatientListResponse(BaseModel):
    """List response containing paginated or filtered patient items."""
    items: List[PatientResponse]
    total: int
    page: int
    size: int
