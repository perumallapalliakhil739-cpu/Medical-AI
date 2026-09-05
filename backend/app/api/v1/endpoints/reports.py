"""
Medical Reports API Endpoints (Step 3, 4, 13, 14, 15).
Handles document ingestion, automated extraction pipeline, side-by-side inspection,
and inline result corrections.
"""

import os
import uuid
import hashlib
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.user import User
from app.models.report import MedicalReport
from app.models.patient import Patient
from app.models.lab_result import LabResult
from app.schemas.report import (
    ReportResponse,
    ReportListResponse,
    LabResultResponse,
    LabResultUpdate
)
from app.services.ai_pipeline import process_medical_report_pipeline
from app.services.reference_range import evaluate_reference_range
from app.services.audit_service import log_audit_event
from app.core.deps import get_current_user
from app.core.config import settings

router = APIRouter()


@router.post(
    "/upload",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and Process Clinical Medical Report",
    description="Uploads a PDF, image, or clinical document, generates SHA-256 hash, and initiates AI extraction pipeline."
)
async def upload_report(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    report_type: Optional[str] = Form("lab"),
    patient_id: Optional[str] = Form(None),
    report_date: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ReportResponse:
    """Upload and process report file."""
    # Verify patient if provided
    if patient_id:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient record '{patient_id}' not found."
            )

    # Read content and compute SHA-256
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size_mb:.1f} MB) exceeds maximum allowed {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    checksum = hashlib.sha256(file_bytes).hexdigest()

    # Save file to uploads directory
    upload_dir = settings.resolved_upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Create MedicalReport record
    report = MedicalReport(
        patient_id=patient_id,
        title=title.strip() if title else file.filename,
        report_type=report_type or "lab",
        source_filename=file.filename,
        file_path=file_path,
        file_size_bytes=len(file_bytes),
        mime_type=file.content_type or "application/octet-stream",
        report_date=report_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        status="uploaded",
        verification_status="pending",
        checksum=checksum
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Trigger AI Extraction Pipeline
    try:
        process_medical_report_pipeline(db=db, report=report, user_id=current_user.id)
    except Exception as exc:
        report.status = "error"
        report.notes = f"Extraction error: {str(exc)}"
        db.commit()

    db.refresh(report)
    return ReportResponse.model_validate(report)


@router.get(
    "",
    response_model=ReportListResponse,
    summary="List Medical Reports",
    description="Retrieves registered clinical reports with filtering by patient, type, and verification status."
)
def list_reports(
    patient_id: Optional[str] = Query(None),
    report_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ReportListResponse:
    """List medical reports with filters."""
    query = db.query(MedicalReport)
    if patient_id:
        query = query.filter(MedicalReport.patient_id == patient_id)
    if report_type:
        query = query.filter(MedicalReport.report_type == report_type)
    if status:
        query = query.filter(MedicalReport.status == status)

    total = query.count()
    items = query.order_by(desc(MedicalReport.created_at)).offset((page - 1) * size).limit(size).all()

    return ReportListResponse(
        items=[ReportResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        size=size
    )


@router.get(
    "/{report_id}",
    response_model=ReportResponse,
    summary="Get Medical Report Details",
    description="Fetches medical report metadata, original extracted text, and structured lab results."
)
def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ReportResponse:
    """Get single report with lab results."""
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medical report '{report_id}' not found."
        )
    return ReportResponse.model_validate(report)


@router.post(
    "/{report_id}/reprocess",
    response_model=ReportResponse,
    summary="Re-run AI Extraction Pipeline",
    description="Re-analyzes document text, extracts structured records, recalculates reference ranges, and scans for conflicts."
)
def reprocess_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ReportResponse:
    """Re-process report."""
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    process_medical_report_pipeline(db=db, report=report, user_id=current_user.id)
    db.refresh(report)
    return ReportResponse.model_validate(report)


@router.put(
    "/{report_id}/results/{result_id}",
    response_model=LabResultResponse,
    summary="Edit Extracted Lab Result (Step 4 & Step 15)",
    description="Modifies an extracted lab result, re-evaluates reference range, records correction notes, and logs audit trail."
)
def update_lab_result(
    report_id: str,
    result_id: str,
    payload: LabResultUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> LabResultResponse:
    """Edit single lab result inline."""
    result = db.query(LabResult).filter(
        LabResult.id == result_id,
        LabResult.report_id == report_id
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Laboratory result '{result_id}' not found in report '{report_id}'."
        )

    # Retain pre-correction value for audit history
    if not result.original_ai_value:
        result.original_ai_value = result.raw_value

    previous_value = result.raw_value

    # Apply updates
    if payload.test_name is not None:
        result.test_name = payload.test_name.strip()
    if payload.raw_value is not None:
        result.raw_value = payload.raw_value.strip()
        try:
            result.numeric_value = float(payload.raw_value.strip())
        except ValueError:
            result.numeric_value = None
    if payload.unit is not None:
        result.unit = payload.unit.strip()
    if payload.reference_range is not None:
        result.reference_range = payload.reference_range.strip()
        result.reference_range_source = "User Corrected"
    if payload.correction_notes is not None:
        result.correction_notes = payload.correction_notes.strip()

    # Re-evaluate reference range
    flag, norm_range, _ = evaluate_reference_range(result.numeric_value, result.reference_range)
    result.flag = flag
    result.verification_status = "corrected"
    result.verified_by_user_id = current_user.id

    db.commit()
    db.refresh(result)

    # Audit log
    log_audit_event(
        db=db,
        action="CORRECT",
        entity_type="lab_result",
        entity_id=result.id,
        user_id=current_user.id,
        details={
            "test_name": result.test_name,
            "previous_value": previous_value,
            "new_value": result.raw_value,
            "correction_notes": result.correction_notes
        }
    )

    return LabResultResponse.model_validate(result)


@router.delete(
    "/{report_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Medical Report",
    description="Deletes a medical report and its extracted results."
)
def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete report."""
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    # Remove physical file if present
    if report.file_path and os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except OSError:
            pass

    db.delete(report)
    db.commit()
    return {"status": "ok", "message": f"Report '{report_id}' deleted."}
