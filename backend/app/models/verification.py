"""
Verification record model tracking human-in-the-loop review, clinician confirmations,
and auditability of extracted medical information.
Architectural foundation for Step 5 Human Verification & Review.
"""

import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, TimestampMixin


class VerificationRecord(Base, TimestampMixin):
    """Clinical practitioner verification record for human oversight compliance."""
    __tablename__ = "verification_records"

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
    verified_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="pending_review",
        nullable=False,
        index=True
    )  # pending_review, clinician_verified, flagged_for_revision, rejected
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signature_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
