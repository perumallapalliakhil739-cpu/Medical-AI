"""
Timeline event entity model organizing longitudinal clinical encounters,
report dates, and diagnostic observations chronologically.
Architectural foundation for Step 6 Timeline & Patient History.
"""

import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, TimestampMixin


class TimelineEvent(Base, TimestampMixin):
    """Chronological clinical encounter or report event."""
    __tablename__ = "timeline_events"

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
    source_report_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("medical_reports.id", ondelete="SET NULL"),
        nullable=True
    )
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)  # lab_test, radiology, clinical_note, consultation
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    facility: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    clinician_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
