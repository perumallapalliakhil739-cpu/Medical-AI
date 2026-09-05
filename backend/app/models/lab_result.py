"""
Lab result entity model representing structured clinical laboratory test values,
units, reference ranges, and provenance links.
Covers Step 4 (Structured Medical Record), Step 5 (Reference Range Awareness),
Step 6 (Source & Provenance), Step 8 (Human Verification), and Step 14 (Confidence Indicators).
"""

import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.report import MedicalReport


class LabResult(Base, TimestampMixin):
    """Extracted laboratory result with strict reference-range, traceability and provenance metadata."""
    __tablename__ = "lab_results"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    report_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("medical_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    patient_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    test_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    analyte_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # e.g., LOINC code
    raw_value: Mapped[str] = mapped_column(String(128), nullable=False)
    numeric_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    # Step 5: Reference-Range Awareness
    reference_range: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    reference_range_source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # e.g. "Report Table Header, Page 1", "Not provided in source report"
    flag: Mapped[Optional[str]] = mapped_column(String(32), default="unspecified", nullable=True)  # normal, low, high, critical, unspecified
    
    # Step 14: Confidence Scoring
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0.0 - 1.0
    
    # Step 6: Provenance & Source Metadata
    source_type: Mapped[str] = mapped_column(String(64), default="Extracted from Report", nullable=False)  # User Provided, Imported, Extracted from Report, AI Generated, AI Calculated, Human Verified
    source_document: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    provenance_page: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    provenance_bbox: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # JSON coordinates bounding box
    extraction_method: Mapped[str] = mapped_column(String(64), default="AI Vision & NLP", nullable=False)
    report_date: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    # Step 8: Human Verification Status
    verification_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)  # pending, verified, corrected, rejected
    verified_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    correction_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    original_ai_value: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)  # Retains pre-correction AI value for audit
    
    observation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extraction_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    report: Mapped["MedicalReport"] = relationship("MedicalReport", back_populates="lab_results")
