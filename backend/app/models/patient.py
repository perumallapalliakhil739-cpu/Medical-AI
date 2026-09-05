"""
Patient entity model representing patient demographic, identification, clinical history,
and per-field provenance/source labels.
Step 2: Patient Management System with complete clinical profile fields and source tracking.
"""

import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.report import MedicalReport
    from app.models.conflict import Conflict
    from app.models.timeline import TimelineEvent


class Patient(Base, TimestampMixin):
    """Patient clinical record model storing demographics, symptoms, history, and medications."""
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    patient_identifier: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    date_of_birth: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  # YYYY-MM-DD
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sex: Mapped[str] = mapped_column(String(32), nullable=False, default="Not Specified")
    contact_information: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Clinical history and profile fields
    symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    medical_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    allergies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_medications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    relevant_medical_history: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    family_history: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    other_information: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # JSON map of per-field provenance sources:
    # e.g., {"name": "User Provided", "age": "Extracted from Report", "allergies": "Human Verified"}
    field_sources: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Legacy / Anonymized identifiers
    mrn: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)
    anonymous_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Multi-tenant and clinician audit accountability
    created_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relationships
    created_by: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="patients",
        foreign_keys=[created_by_user_id]
    )
    reports: Mapped[list["MedicalReport"]] = relationship(
        "MedicalReport",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(MedicalReport.created_at)"
    )
    conflicts: Mapped[list["Conflict"]] = relationship(
        "Conflict",
        cascade="all, delete-orphan",
        primaryjoin="Patient.id == foreign(Conflict.patient_id)"
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        "TimelineEvent",
        cascade="all, delete-orphan",
        primaryjoin="Patient.id == foreign(TimelineEvent.patient_id)",
        order_by="desc(TimelineEvent.event_date)"
    )

    @property
    def patient_id(self) -> str:
        """Alias for patient_identifier."""
        return self.patient_identifier
