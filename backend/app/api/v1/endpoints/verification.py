"""
Human Verification Center Endpoints (Step 8 & Step 14).
Provides human-in-the-loop review queue for accepting, editing, correcting,
and rejecting AI extractions while retaining full audit history.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database.session import get_db
from app.models.user import User
from app.models.lab_result import LabResult
from app.models.report import MedicalReport
from app.models.patient import Patient
from app.models.verification import VerificationRecord
from app.schemas.verification import (
    VerificationQueueItem,
    VerificationEditPayload,
    VerificationRejectPayload,
    VerificationActionResponse
)
from app.schemas.report import LabResultResponse
from app.services.reference_range import evaluate_reference_range
from app.services.audit_service import log_audit_event
from app.core.deps import get_current_user

router = APIRouter()


@router.get(
    "/queue",
    response_model=List[VerificationQueueItem],
    summary="Fetch Human Verification Review Queue",
    description="Returns all extracted items requiring clinical review (status pending, flagged, or low confidence)."
)
def get_verification_queue(
    status_filter: Optional[str] = Query(None, description="Filter by pending, corrected, verified, rejected"),
    patient_id: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(None),
    max_confidence: Optional[float] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[VerificationQueueItem]:
    """Retrieve verification queue items."""
    query = (
        db.query(LabResult, MedicalReport, Patient)
        .join(MedicalReport, LabResult.report_id == MedicalReport.id)
        .outerjoin(Patient, LabResult.patient_id == Patient.id)
    )

    if status_filter:
        query = query.filter(LabResult.verification_status == status_filter)
    else:
        # Default to items requiring review: pending or corrected
        query = query.filter(LabResult.verification_status.in_(["pending", "corrected"]))

    if patient_id:
        query = query.filter(LabResult.patient_id == patient_id)

    if min_confidence is not None:
        query = query.filter(LabResult.confidence_score >= min_confidence)
    if max_confidence is not None:
        query = query.filter(LabResult.confidence_score <= max_confidence)

    rows = query.order_by(LabResult.confidence_score.asc(), desc(LabResult.created_at)).all()

    queue_items = []
    for lab, rep, pat in rows:
        queue_items.append(
            VerificationQueueItem(
                id=lab.id,
                report_id=rep.id,
                report_title=rep.title,
                patient_id=pat.id if pat else None,
                patient_name=pat.name if pat else "Unknown Patient",
                test_name=lab.test_name,
                raw_value=lab.raw_value,
                unit=lab.unit,
                reference_range=lab.reference_range,
                flag=lab.flag,
                confidence_score=lab.confidence_score,
                source_document=rep.source_filename,
                verification_status=lab.verification_status,
                correction_notes=lab.correction_notes,
                original_ai_value=lab.original_ai_value,
                observation=lab.observation,
                created_at=lab.created_at
            )
        )

    return queue_items


@router.post(
    "/results/{result_id}/accept",
    response_model=VerificationActionResponse,
    summary="Accept AI Extraction",
    description="Confirms that an AI extracted test measurement is clinically accurate verbatim."
)
def accept_extraction(
    result_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> VerificationActionResponse:
    """Mark extraction as verified."""
    lab = db.query(LabResult).filter(LabResult.id == result_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab result not found.")

    lab.verification_status = "verified"
    lab.verified_by_user_id = current_user.id
    lab.source_type = "Human Verified"

    # Update parent report verification status if all items verified
    unverified_count = db.query(LabResult).filter(
        LabResult.report_id == lab.report_id,
        LabResult.verification_status == "pending"
    ).count()

    rep = db.query(MedicalReport).filter(MedicalReport.id == lab.report_id).first()
    if rep and unverified_count == 0:
        rep.verification_status = "verified"

    db.commit()
    db.refresh(lab)

    log_audit_event(
        db=db,
        action="VERIFY",
        entity_type="lab_result",
        entity_id=lab.id,
        user_id=current_user.id,
        details={"test_name": lab.test_name, "accepted_value": lab.raw_value}
    )

    return VerificationActionResponse(
        status="verified",
        message=f"Measurement for '{lab.test_name}' verified by clinician.",
        result=LabResultResponse.model_validate(lab)
    )


@router.post(
    "/results/{result_id}/edit",
    response_model=VerificationActionResponse,
    summary="Correct AI Extraction (Step 8 & Step 15)",
    description="Updates extracted test value with clinician corrections, retaining original AI extraction in audit trail."
)
def edit_extraction(
    result_id: str,
    payload: VerificationEditPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> VerificationActionResponse:
    """Correct extraction with notes."""
    lab = db.query(LabResult).filter(LabResult.id == result_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab result not found.")

    # Retain pre-correction value
    if not lab.original_ai_value:
        lab.original_ai_value = lab.raw_value

    previous_val = lab.raw_value
    lab.raw_value = payload.corrected_value.strip()
    try:
        lab.numeric_value = float(payload.corrected_value.strip())
    except ValueError:
        lab.numeric_value = None

    if payload.corrected_unit:
        lab.unit = payload.corrected_unit.strip()
    if payload.corrected_range:
        lab.reference_range = payload.corrected_range.strip()
        lab.reference_range_source = "User Verified / Corrected"

    lab.correction_notes = payload.correction_notes.strip()
    lab.verification_status = "corrected"
    lab.source_type = "Human Verified"
    lab.verified_by_user_id = current_user.id

    # Re-evaluate reference range
    flag, _, _ = evaluate_reference_range(lab.numeric_value, lab.reference_range)
    lab.flag = flag

    db.commit()
    db.refresh(lab)

    log_audit_event(
        db=db,
        action="CORRECT",
        entity_type="lab_result",
        entity_id=lab.id,
        user_id=current_user.id,
        details={
            "test_name": lab.test_name,
            "original_value": lab.original_ai_value,
            "previous_value": previous_val,
            "new_value": lab.raw_value,
            "notes": lab.correction_notes
        }
    )

    return VerificationActionResponse(
        status="corrected",
        message=f"Measurement for '{lab.test_name}' updated and verified.",
        result=LabResultResponse.model_validate(lab)
    )


@router.post(
    "/results/{result_id}/reject",
    response_model=VerificationActionResponse,
    summary="Reject Erroneous AI Extraction",
    description="Marks an AI extraction as rejected so it is excluded from active clinical intelligence calculations."
)
def reject_extraction(
    result_id: str,
    payload: VerificationRejectPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> VerificationActionResponse:
    """Reject extraction."""
    lab = db.query(LabResult).filter(LabResult.id == result_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab result not found.")

    lab.verification_status = "rejected"
    lab.correction_notes = f"REJECTED: {payload.rejection_reason.strip()}"
    lab.verified_by_user_id = current_user.id

    db.commit()
    db.refresh(lab)

    log_audit_event(
        db=db,
        action="REJECT",
        entity_type="lab_result",
        entity_id=lab.id,
        user_id=current_user.id,
        details={"test_name": lab.test_name, "reason": payload.rejection_reason}
    )

    return VerificationActionResponse(
        status="rejected",
        message=f"Extraction for '{lab.test_name}' rejected.",
        result=LabResultResponse.model_validate(lab)
    )


@router.post(
    "/reports/{report_id}/verify-all",
    summary="Batch Verify Entire Report",
    description="Marks all pending items in a medical report as verified by clinician."
)
def verify_entire_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Batch verify all results in a report."""
    rep = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    results = db.query(LabResult).filter(
        LabResult.report_id == report_id,
        LabResult.verification_status == "pending"
    ).all()

    for r in results:
        r.verification_status = "verified"
        r.verified_by_user_id = current_user.id
        r.source_type = "Human Verified"

    rep.verification_status = "verified"
    db.commit()

    log_audit_event(
        db=db,
        action="VERIFY",
        entity_type="report",
        entity_id=rep.id,
        user_id=current_user.id,
        details={"report_title": rep.title, "verified_items_count": len(results)}
    )

    return {
        "status": "ok",
        "message": f"All {len(results)} items in '{rep.title}' verified."
    }
