"""
Audit Logging Service (Step 16).
Records immutable audit logs of clinical data creation, updates, verification, and corrections.
"""

import json
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """
    Creates an immutable audit log entry.
    
    Actions:
        CREATE, UPDATE, DELETE, VERIFY, CORRECT, REJECT, EXPORT, UPLOAD, AI_EXTRACT, CONFLICT_DETECTED
    """
    serialized_details = json.dumps(details, default=str) if details else None

    entry = AuditLog(
        user_id=user_id,
        action=action.upper(),
        entity_type=entity_type.lower(),
        entity_id=entity_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=serialized_details,
        created_at=datetime.now(timezone.utc)
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
