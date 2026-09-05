"""
Patient management REST API endpoints: Create, List, Retrieve, Update, Delete.
All endpoints require valid authentication and enforce clinical data validation.
"""

import uuid
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse
)
from app.services.audit_service import log_audit_event
from app.core.deps import get_current_user

router = APIRouter()


def generate_patient_identifier(db: Session) -> str:
    """Generate a unique human-friendly clinical patient identifier."""
    prefix = f"PT-{datetime.now(timezone.utc).strftime('%Y%m')}"
    for _ in range(10):
        suffix = uuid.uuid4().hex[:4].upper()
        identifier = f"{prefix}-{suffix}"
        existing = db.query(Patient).filter(Patient.patient_identifier == identifier).first()
        if not existing:
            return identifier
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Clinical Patient",
    description="Registers a patient record with demographic, clinical history, allergy, and current medication records."
)
def create_patient(
    payload: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PatientResponse:
    """Create new patient profile."""
    identifier = payload.patient_identifier.strip() if payload.patient_identifier else generate_patient_identifier(db)

    existing = db.query(Patient).filter(Patient.patient_identifier == identifier).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient identifier '{identifier}' is already assigned to an existing record."
        )

    # Set default field sources if not provided
    field_sources = payload.field_sources
    if not field_sources:
        field_sources = json.dumps({
            "name": "User Provided",
            "age": "User Provided",
            "date_of_birth": "User Provided",
            "sex": "User Provided",
            "symptoms": "User Provided",
            "medical_conditions": "User Provided",
            "allergies": "User Provided",
            "current_medications": "User Provided"
        })

    new_patient = Patient(
        patient_identifier=identifier,
        name=payload.name.strip(),
        date_of_birth=payload.date_of_birth.strip() if payload.date_of_birth else None,
        age=payload.age,
        sex=payload.sex.strip() if payload.sex else "Not Specified",
        contact_information=payload.contact_information.strip() if payload.contact_information else None,
        symptoms=payload.symptoms.strip() if payload.symptoms else None,
        medical_conditions=payload.medical_conditions.strip() if payload.medical_conditions else None,
        allergies=payload.allergies.strip() if payload.allergies else None,
        current_medications=payload.current_medications.strip() if payload.current_medications else None,
        relevant_medical_history=payload.relevant_medical_history.strip() if payload.relevant_medical_history else None,
        family_history=payload.family_history.strip() if payload.family_history else None,
        other_information=payload.other_information.strip() if payload.other_information else None,
        field_sources=field_sources,
        anonymous_id=f"ANON-{uuid.uuid4().hex[:10].upper()}",
        created_by_user_id=current_user.id
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    log_audit_event(
        db=db,
        action="CREATE",
        entity_type="patient",
        entity_id=new_patient.id,
        user_id=current_user.id,
        details={"name": new_patient.name, "patient_identifier": new_patient.patient_identifier}
    )

    return PatientResponse.model_validate(new_patient)


@router.get(
    "",
    response_model=PatientListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Clinical Patients",
    description="Lists registered patients with optional multi-attribute search filtering across name, ID, symptoms, or medical conditions."
)
def list_patients(
    search: Optional[str] = Query(default=None, description="Search query across patient name, ID, or conditions"),
    page: int = Query(default=1, ge=1, description="Page number"),
    size: int = Query(default=50, ge=1, le=100, description="Page size"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PatientListResponse:
    """Retrieve filtered list of patients."""
    query = db.query(Patient)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.name.ilike(term),
                Patient.patient_identifier.ilike(term),
                Patient.symptoms.ilike(term),
                Patient.medical_conditions.ilike(term),
                Patient.allergies.ilike(term),
                Patient.current_medications.ilike(term)
            )
        )

    total = query.count()
    items = query.order_by(Patient.created_at.desc()).offset((page - 1) * size).limit(size).all()

    return PatientListResponse(
        items=[PatientResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        size=size
    )


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Patient Record",
    description="Fetches full demographic, symptom, and medication details for a specific patient by ID or clinical identifier."
)
def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PatientResponse:
    """Get single patient record."""
    patient = db.query(Patient).filter(
        or_(Patient.id == patient_id, Patient.patient_identifier == patient_id)
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient record with identifier '{patient_id}' not found."
        )

    return PatientResponse.model_validate(patient)


@router.put(
    "/{patient_id}",
    response_model=PatientResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Patient Record",
    description="Modifies an existing patient record. Maintains data integrity and audit readiness."
)
def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PatientResponse:
    """Update patient details."""
    patient = db.query(Patient).filter(
        or_(Patient.id == patient_id, Patient.patient_identifier == patient_id)
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient record with identifier '{patient_id}' not found."
        )

    changes = {}
    if payload.name is not None:
        changes["name"] = {"old": patient.name, "new": payload.name.strip()}
        patient.name = payload.name.strip()
    if payload.patient_identifier is not None:
        new_ident = payload.patient_identifier.strip()
        if new_ident != patient.patient_identifier:
            existing = db.query(Patient).filter(Patient.patient_identifier == new_ident).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Patient identifier '{new_ident}' is already in use."
                )
            changes["patient_identifier"] = {"old": patient.patient_identifier, "new": new_ident}
            patient.patient_identifier = new_ident
    if payload.date_of_birth is not None:
        patient.date_of_birth = payload.date_of_birth.strip() if payload.date_of_birth else None
    if payload.age is not None:
        changes["age"] = {"old": patient.age, "new": payload.age}
        patient.age = payload.age
    if payload.sex is not None:
        patient.sex = payload.sex.strip()
    if payload.contact_information is not None:
        patient.contact_information = payload.contact_information.strip() if payload.contact_information else None
    if payload.symptoms is not None:
        patient.symptoms = payload.symptoms.strip() if payload.symptoms else None
    if payload.medical_conditions is not None:
        patient.medical_conditions = payload.medical_conditions.strip() if payload.medical_conditions else None
    if payload.allergies is not None:
        changes["allergies"] = {"old": patient.allergies, "new": payload.allergies.strip() if payload.allergies else None}
        patient.allergies = payload.allergies.strip() if payload.allergies else None
    if payload.current_medications is not None:
        changes["current_medications"] = {"old": patient.current_medications, "new": payload.current_medications.strip() if payload.current_medications else None}
        patient.current_medications = payload.current_medications.strip() if payload.current_medications else None
    if payload.relevant_medical_history is not None:
        patient.relevant_medical_history = payload.relevant_medical_history.strip() if payload.relevant_medical_history else None
    if payload.family_history is not None:
        patient.family_history = payload.family_history.strip() if payload.family_history else None
    if payload.other_information is not None:
        patient.other_information = payload.other_information.strip() if payload.other_information else None
    if payload.field_sources is not None:
        patient.field_sources = payload.field_sources

    db.commit()
    db.refresh(patient)

    log_audit_event(
        db=db,
        action="UPDATE",
        entity_type="patient",
        entity_id=patient.id,
        user_id=current_user.id,
        details={"changes": changes}
    )

    return PatientResponse.model_validate(patient)


@router.delete(
    "/{patient_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Patient Record",
    description="Removes a patient record and cascaded associations."
)
def delete_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete patient record."""
    patient = db.query(Patient).filter(
        or_(Patient.id == patient_id, Patient.patient_identifier == patient_id)
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient record with identifier '{patient_id}' not found."
        )

    deleted_id = patient.patient_identifier
    patient_uuid = patient.id
    db.delete(patient)
    db.commit()

    log_audit_event(
        db=db,
        action="DELETE",
        entity_type="patient",
        entity_id=patient_uuid,
        user_id=current_user.id,
        details={"deleted_identifier": deleted_id}
    )

    return {
        "status": "ok",
        "message": f"Patient record '{deleted_id}' was successfully deleted."
    }
