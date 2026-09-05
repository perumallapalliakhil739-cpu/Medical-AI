"""
Responsible AI Endpoints (Step 9, 20, 21).
Generates cautious clinical summaries and test text extractions with strict guardrails.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.report import MedicalReport
from app.models.lab_result import LabResult
from app.models.patient import Patient
from app.services.ai_pipeline import generate_responsible_ai_summary, parse_clinical_text
from app.core.deps import get_current_user

router = APIRouter()


class SummaryRequest(BaseModel):
    """Request payload for AI summary generation."""
    report_id: Optional[str] = None
    patient_id: Optional[str] = None


class ExtractTextRequest(BaseModel):
    """Direct clinical text extraction test request."""
    clinical_text: str = Field(..., min_length=5, description="Raw medical text or lab panel to parse")
    source_name: Optional[str] = "Pasted Clinical Text"


@router.post(
    "/summary",
    summary="Generate Patient-Friendly Responsible AI Summary (Step 9)",
    description="Produces a cautious, non-diagnostic clinical summary labeled 'AI Generated Summary'."
)
def generate_summary(
    payload: SummaryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Generate or refresh AI summary."""
    if payload.report_id:
        report = db.query(MedicalReport).filter(MedicalReport.id == payload.report_id).first()
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

        labs = db.query(LabResult).filter(LabResult.report_id == report.id).all()
        lab_dicts = [
            {
                "test_name": l.test_name,
                "raw_value": l.raw_value,
                "unit": l.unit,
                "flag": l.flag,
                "reference_range": l.reference_range
            }
            for l in labs
        ]

        patient_name = report.patient.name if report.patient else "Patient"
        summary_text = generate_responsible_ai_summary(patient_name, lab_dicts, report.title)

        report.ai_summary = summary_text
        db.commit()

        return {
            "source_type": "AI Generated",
            "report_id": report.id,
            "report_title": report.title,
            "summary": summary_text,
            "guardrail_notice": "MedLens summaries never formulate diagnoses or therapy adjustments."
        }

    elif payload.patient_id:
        patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

        all_labs = (
            db.query(LabResult)
            .filter(LabResult.patient_id == patient.id)
            .all()
        )
        lab_dicts = [
            {
                "test_name": l.test_name,
                "raw_value": l.raw_value,
                "unit": l.unit,
                "flag": l.flag,
                "reference_range": l.reference_range
            }
            for l in all_labs
        ]
        summary_text = generate_responsible_ai_summary(patient.name, lab_dicts, f"Longitudinal Records for {patient.name}")

        return {
            "source_type": "AI Generated",
            "patient_id": patient.id,
            "patient_name": patient.name,
            "summary": summary_text,
            "guardrail_notice": "MedLens summaries never formulate diagnoses or therapy adjustments."
        }

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must provide report_id or patient_id.")


@router.post(
    "/extract-direct",
    summary="Direct Clinical Text Extraction Test",
    description="Parses arbitrary pasted laboratory text using the clinical NLP extraction engine."
)
def extract_direct_text(
    payload: ExtractTextRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Test text parser directly."""
    results, metadata = parse_clinical_text(payload.clinical_text, payload.source_name)
    return {
        "extracted_tests": results,
        "metadata": metadata,
        "total_extracted": len(results)
    }
