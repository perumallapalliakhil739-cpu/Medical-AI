"""
Audit log entity model ensuring HIPAA and clinical governance compliance
by recording immutable access and modification actions.
Architectural foundation for Step 8 Security, Privacy & Audit History.
"""

import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class AuditLog(Base):
    """Immutable audit trail entry for security, access review, and compliance."""
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # VIEW, EXPORT, VERIFY, MODIFY
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)  # patient, report, lab_result
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Structured JSON string of change context
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
