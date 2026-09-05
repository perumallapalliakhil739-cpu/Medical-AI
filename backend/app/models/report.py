"""
Medical report entity model storing metadata, integrity checksums, document text,
processing status, and verification workflow.
"""

import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, BigInteger, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.lab_result import LabResult
    from app.models.verification import VerificationRecord


class MedicalReport(Base, TimestampMixin):
    """Medical report metadata, OCR text, and processing tracking model."""
    __tablename__ = "medical_reports"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    patient_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[str] = mapped_column(String(64), nullable=False)  # pathology, radiology, lab, cbc, lipid, metabolic
    source_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    report_date: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # Formatted date from report
    status: Mapped[str] = mapped_column(String(32), default="uploaded", nullable=False, index=True)  # uploaded, processing, extracted, verified, error
    verification_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)  # pending, verified, corrected, rejected
    extraction_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Aggregate confidence 0.0 - 1.0
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Raw OCR / extracted document text
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # AI-generated clinical summary
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 integrity hash
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    patient: Mapped[Optional["Patient"]] = relationship("Patient", back_populates="reports")
    lab_results: Mapped[list["LabResult"]] = relationship(
        "LabResult",
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="LabResult.test_name"
    )
    verification_records: Mapped[list["VerificationRecord"]] = relationship(
        "VerificationRecord",
        cascade="all, delete-orphan"
    )
