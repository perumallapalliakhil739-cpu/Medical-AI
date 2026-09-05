"""
Conflict entity model capturing discrepancies, chronological contradictions,
and unit/value discrepancies across multiple patient reports.
Architectural foundation for Step 6 Conflict Detection & Report Comparison.
"""

import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, TimestampMixin


class Conflict(Base, TimestampMixin):
    """Clinical data discrepancy or contradiction across reports."""
    __tablename__ = "conflicts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    patient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    source_report_a_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("medical_reports.id", ondelete="CASCADE"),
        nullable=False
    )
    source_report_b_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("medical_reports.id", ondelete="CASCADE"),
        nullable=True
    )
    conflict_type: Mapped[str] = mapped_column(String(64), nullable=False)  # value_discrepancy, date_anomaly, medication_mismatch, reference_conflict
    severity: Mapped[str] = mapped_column(String(32), default="medium", nullable=False)  # low, medium, high, critical
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="detected", nullable=False)  # detected, acknowledged, resolved, dismissed
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
