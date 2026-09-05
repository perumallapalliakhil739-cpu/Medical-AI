"""
Conflict & Inconsistency Detection Endpoints (Step 7).
Identifies discrepancies across patient profile and reports without auto-deciding.
Demands human verification.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.user import User
from app.models.conflict import Conflict
from app.models.patient import Patient
from app.models.report import MedicalReport
from app.schemas.conflict import ConflictResponse, ConflictResolvePayload
from app.services.audit_service import log_audit_event
from app.core.deps import get_current_user

router = APIRouter()


@router.get(
    "",
    response_model=List[ConflictResponse],
    summary="List Detected Clinical Conflicts",
    description="Lists all inconsistencies, demographic contradictions, medication conflicts, and unit discrepancies."
)
def list_conflicts(
    patient_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, description="Filter by detected, resolved, or dismissed"),
    severity: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[ConflictResponse]:
    """List conflicts with patient and report titles."""
    query = db.query(Conflict)
    if patient_id:
        query = query.filter(Conflict.patient_id == patient_id)
    if status_filter:
        query = query.filter(Conflict.status == status_filter)
    if severity:
        query = query.filter(Conflict.severity == severity)

    conflicts = query.order_by(desc(Conflict.created_at)).all()

    results = []
    for c in conflicts:
        patient = db.query(Patient).filter(Patient.id == c.patient_id).first()
        rep_a = db.query(MedicalReport).filter(MedicalReport.id == c.source_report_a_id).first()
        rep_b = db.query(MedicalReport).filter(MedicalReport.id == c.source_report_b_id).first() if c.source_report_b_id else None

        results.append(
            ConflictResponse(
                id=c.id,
                patient_id=c.patient_id,
                patient_name=patient.name if patient else "Unknown Patient",
                source_report_a_id=c.source_report_a_id,
                source_report_a_title=rep_a.title if rep_a else "Report A",
                source_report_b_id=c.source_report_b_id,
                source_report_b_title=rep_b.title if rep_b else None,
                conflict_type=c.conflict_type,
                severity=c.severity,
                description=c.description,
                status=c.status,
                resolution_notes=c.resolution_notes,
                created_at=c.created_at,
                updated_at=c.updated_at
            )
        )

    return results


@router.post(
    "/{conflict_id}/resolve",
    response_model=ConflictResponse,
    summary="Resolve Clinical Inconsistency (Step 7 & Step 8)",
    description="Records human clinician resolution of an information discrepancy. AI does not decide."
)
def resolve_conflict(
    conflict_id: str,
    payload: ConflictResolvePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ConflictResponse:
    """Resolve or dismiss conflict."""
    conflict = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict record not found.")

    conflict.status = payload.action if payload.action in ["resolved", "dismissed"] else "resolved"
    conflict.resolution_notes = f"Verified by {current_user.full_name}: {payload.resolution_notes.strip()}"

    db.commit()
    db.refresh(conflict)

    log_audit_event(
        db=db,
        action="RESOLVE_CONFLICT",
        entity_type="conflict",
        entity_id=conflict.id,
        user_id=current_user.id,
        details={
            "conflict_type": conflict.conflict_type,
            "resolution_action": conflict.status,
            "resolution_notes": conflict.resolution_notes
        }
    )

    patient = db.query(Patient).filter(Patient.id == conflict.patient_id).first()
    rep_a = db.query(MedicalReport).filter(MedicalReport.id == conflict.source_report_a_id).first()

    return ConflictResponse(
        id=conflict.id,
        patient_id=conflict.patient_id,
        patient_name=patient.name if patient else "Unknown",
        source_report_a_id=conflict.source_report_a_id,
        source_report_a_title=rep_a.title if rep_a else "Report A",
        source_report_b_id=conflict.source_report_b_id,
        source_report_b_title=None,
        conflict_type=conflict.conflict_type,
        severity=conflict.severity,
        description=conflict.description,
        status=conflict.status,
        resolution_notes=conflict.resolution_notes,
        created_at=conflict.created_at,
        updated_at=conflict.updated_at
    )
