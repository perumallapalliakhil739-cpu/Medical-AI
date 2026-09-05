"""
Authentication and user account Pydantic schemas for MedLens.
"""

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class UserSignupRequest(BaseModel):
    """Payload for clinician and staff registration."""
    name: str = Field(..., min_length=2, max_length=128, description="Full legal clinician or operator name")
    email: str = Field(..., min_length=5, max_length=255, description="Valid medical or institutional email address")
    password: str = Field(..., min_length=8, max_length=128, description="Strong account password (minimum 8 characters)")
    role: str = Field(default="clinician", description="User role (clinician, auditor, admin)")
    institution: Optional[str] = Field(default=None, max_length=255, description="Hospital, clinic, or medical network")
    license_number: Optional[str] = Field(default=None, max_length=128, description="Medical practitioner license or NPI identifier")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Please provide a valid email address (e.g. clinician@hospital.org)")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        valid_roles = {"clinician", "auditor", "admin", "viewer"}
        if v.lower() not in valid_roles:
            raise ValueError(f"Role must be one of: {', '.join(valid_roles)}")
        return v.lower()


class UserLoginRequest(BaseModel):
    """Payload for user sign in."""
    email: str = Field(..., min_length=3, description="Registered account email")
    password: str = Field(..., min_length=1, description="Account password")


class UserResponse(BaseModel):
    """Public user profile response (password hash strictly omitted)."""
    id: str
    name: str
    email: str
    role: str
    account_status: str
    institution: Optional[str] = None
    license_number: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT bearer token authentication response."""
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int = 60 * 24
    user: UserResponse
