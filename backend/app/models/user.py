"""
User entity model representing clinical practitioners, auditors, and system operators.
Step 2: Authentication, Role-Based Access Control (RBAC), and user session management.
"""

import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.patient import Patient


class User(Base, TimestampMixin):
    """User account model for authentication, access control, and audit accountability."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(64), default="clinician", nullable=False)  # clinician, auditor, admin
    account_status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)  # active, suspended, pending
    license_number: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    institution: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    patients: Mapped[list["Patient"]] = relationship(
        "Patient",
        back_populates="created_by",
        foreign_keys="Patient.created_by_user_id"
    )

    @property
    def name(self) -> str:
        """Alias full_name as name."""
        return self.full_name

    @property
    def password_hash(self) -> str:
        """Alias hashed_password as password_hash."""
        return self.hashed_password
