"""
Patient Chronological Timeline API Endpoints (Step 11).
Aggregates medical reports, diagnostic encounters, and lab events in chronological sequence.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.database.session import get_db
from app.models.user import User
from app.models.timeline import TimelineEvent
from app.models.report import MedicalReport
from app.models.patient import Patient
from app.schemas.timeline import TimelineEventResponse, TimelineEventCreate
from app.services.audit_service import log_audit_event
from app.core.deps import get_current_user

router = APIRouter()


@router.get(
    "/{patient_id}",
    response_model=List[TimelineEventResponse],
    summary="Get Chronological Patient Timeline (Step 11)",
    description="Retrieves a patient's historical medical events ordered chronologically with multi-parameter filtering."
)
def get_patient_timeline(
    patient_id: str,
    event_type: Optional[str] = Query(None, description="Filter by lab_test, radiology, clinical_note, consultation"),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[TimelineEventResponse]:
    """Retrieve chronological clinical timeline."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    query = db.query(TimelineEvent).filter(TimelineEvent.patient_id == patient_id)

    if event_type:
        query = query.filter(TimelineEvent.event_type == event_type)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(TimelineEvent.event_date >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(TimelineEvent.event_date <= end_dt)
        except ValueError:
            pass

    if order == "asc":
        events = query.order_by(asc(TimelineEvent.event_date)).all()
    else:
        events = query.order_by(desc(TimelineEvent.event_date)).all()

    results = []
    for e in events:
        rep = db.query(MedicalReport).filter(MedicalReport.id == e.source_report_id).first() if e.source_report_id else None
        results.append(
            TimelineEventResponse(
                id=e.id,
                patient_id=e.patient_id,
                source_report_id=e.source_report_id,
                source_report_title=rep.title if rep else None,
                event_date=e.event_date,
                event_type=e.event_type,
                title=e.title,
                summary=e.summary,
                facility=e.facility,
                clinician_name=e.clinician_name,
                created_at=e.created_at
            )
        )

    return results


@router.post(
    "",
    response_model=TimelineEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Manual Clinical Timeline Event",
    description="Registers a historical clinical event or outside encounter to the patient timeline."
)
def create_timeline_event(
    payload: TimelineEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TimelineEventResponse:
    """Create manual timeline event."""
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    event = TimelineEvent(
        patient_id=payload.patient_id,
        source_report_id=payload.source_report_id,
        event_date=payload.event_date,
        event_type=payload.event_type,
        title=payload.title.strip(),
        summary=payload.summary.strip() if payload.summary else None,
        facility=payload.facility.strip() if payload.facility else None,
        clinician_name=payload.clinician_name.strip() if payload.clinician_name else current_user.full_name
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    log_audit_event(
        db=db,
        action="CREATE_TIMELINE_EVENT",
        entity_type="timeline_event",
        entity_id=event.id,
        user_id=current_user.id,
        details={"title": event.title, "patient_id": event.patient_id}
    )

    return TimelineEventResponse.model_validate(event)
