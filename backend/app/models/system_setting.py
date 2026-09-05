"""
System settings and dynamic configuration model.
Enables runtime customization of confidence thresholds, theme, AI instructions, and feature toggles.
"""

import uuid
from typing import Optional
from sqlalchemy import String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, TimestampMixin


class SystemSetting(Base, TimestampMixin):
    """Dynamic system configuration key-value storage."""
    __tablename__ = "system_settings"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(64), default="general", nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
