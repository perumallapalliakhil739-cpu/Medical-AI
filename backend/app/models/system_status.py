"""
System status model for health validation and audit checks.
"""

from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, TimestampMixin


class SystemStatus(Base, TimestampMixin):
    """System status and audit entity."""
    __tablename__ = "system_status"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default="medlens-core")
    status: Mapped[str] = mapped_column(String(32), default="operational", nullable=False)
    environment: Mapped[str] = mapped_column(String(32), default="development", nullable=False)
    version: Mapped[str] = mapped_column(String(32), default="0.1.0", nullable=False)
    safety_protocol_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
