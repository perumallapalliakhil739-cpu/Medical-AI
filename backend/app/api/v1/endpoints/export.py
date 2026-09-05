"""
Export Functionality Endpoints (Step 23).
Exports structured patient records, provenance, and verification history
to CSV, JSON, and printable HTML/PDF clinical summary sheets.
"""

import io
import csv
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.report import MedicalReport
from app.models.lab_result import LabResult
from app.models.timeline import TimelineEvent
from app.services.audit_service import log_audit_event
from app.core.deps import get_current_user

router = APIRouter()


@router.get(
    "/patient/{patient_id}/csv",
    summary="Export Patient Structured Lab Results to CSV",
    description="Generates standard clinical CSV file containing all tests, values, units, ranges, and verification status."
)
def export_patient_csv(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export patient data as CSV."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    labs = db.query(LabResult).filter(LabResult.patient_id == patient.id).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Write Header
    writer.writerow([
        "Patient ID",
        "Patient Name",
        "Test Name",
        "LOINC Code",
        "Value",
        "Unit",
        "Reference Range",
        "Reference Range Source",
        "Status Flag",
        "Confidence Score",
        "Verification Status",
        "Source Document",
        "Report Date",
        "Extraction Method"
    ])

    for lab in labs:
        writer.writerow([
            patient.patient_identifier,
            patient.name,
            lab.test_name,
            lab.analyte_code or "",
            lab.raw_value,
            lab.unit or "",
            lab.reference_range or "Not provided in source report",
            lab.reference_range_source or "",
            lab.flag or "unspecified",
            f"{int(lab.confidence_score * 100)}%" if lab.confidence_score else "N/A",
            lab.verification_status,
            lab.source_document or "",
            lab.report_date or "",
            lab.extraction_method or ""
        ])

    output.seek(0)
    filename = f"MedLens_{patient.patient_identifier}_records.csv"

    log_audit_event(
        db=db,
        action="EXPORT_CSV",
        entity_type="patient",
        entity_id=patient.id,
        user_id=current_user.id,
        details={"record_count": len(labs)}
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get(
    "/patient/{patient_id}/json",
    summary="Export Full Patient Clinical Dossier to JSON",
    description="Generates machine-readable clinical dossier including demographics, reports, lab results, provenance, and AI summaries."
)
def export_patient_json(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export patient data as JSON."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == patient.id).all()
    labs = db.query(LabResult).filter(LabResult.patient_id == patient.id).all()
    events = db.query(TimelineEvent).filter(TimelineEvent.patient_id == patient.id).all()

    payload = {
        "metadata": {
            "system": "MedLens — AI-Powered Clinical Information Intelligence",
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "exported_by": current_user.email,
            "safety_notice": "MedLens is an information organization tool and not a diagnostic system."
        },
        "patient_profile": {
            "id": patient.id,
            "patient_identifier": patient.patient_identifier,
            "name": patient.name,
            "age": patient.age,
            "date_of_birth": patient.date_of_birth,
            "sex": patient.sex,
            "contact_information": patient.contact_information,
            "symptoms": patient.symptoms,
            "medical_conditions": patient.medical_conditions,
            "allergies": patient.allergies,
            "current_medications": patient.current_medications,
            "relevant_medical_history": patient.relevant_medical_history,
            "family_history": patient.family_history,
            "field_sources": json.loads(patient.field_sources) if patient.field_sources else {}
        },
        "medical_reports": [
            {
                "id": r.id,
                "title": r.title,
                "type": r.report_type,
                "report_date": r.report_date,
                "checksum": r.checksum,
                "verification_status": r.verification_status,
                "ai_summary": r.ai_summary
            }
            for r in reports
        ],
        "structured_lab_records": [
            {
                "test_name": l.test_name,
                "analyte_code": l.analyte_code,
                "value": l.raw_value,
                "numeric_value": l.numeric_value,
                "unit": l.unit,
                "reference_range": l.reference_range,
                "reference_range_source": l.reference_range_source,
                "flag": l.flag,
                "confidence_score": l.confidence_score,
                "source_type": l.source_type,
                "source_document": l.source_document,
                "verification_status": l.verification_status,
                "correction_notes": l.correction_notes,
                "original_ai_value": l.original_ai_value
            }
            for l in labs
        ],
        "timeline": [
            {
                "date": str(e.event_date),
                "type": e.event_type,
                "title": e.title,
                "summary": e.summary
            }
            for e in events
        ]
    }

    log_audit_event(
        db=db,
        action="EXPORT_JSON",
        entity_type="patient",
        entity_id=patient.id,
        user_id=current_user.id,
        details={"reports_count": len(reports), "labs_count": len(labs)}
    )

    return Response(
        content=json.dumps(payload, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=MedLens_{patient.patient_identifier}_dossier.json"}
    )


@router.get(
    "/patient/{patient_id}/html",
    summary="Export Formatted Printable Clinical Summary Sheet",
    description="Returns a formatted HTML document with clinical styling, print stylesheet, and prominent AI provenance disclaimers."
)
def export_patient_html(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export formatted printable clinical summary."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == patient.id).all()
    labs = db.query(LabResult).filter(LabResult.patient_id == patient.id).all()

    lab_rows = ""
    for l in labs:
        badge_color = "#10b981" if l.flag == "normal" else ("#ef4444" if l.flag in ["high", "critical"] else ("#f59e0b" if l.flag == "low" else "#6b7280"))
        lab_rows += f"""
        <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">{l.test_name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">{l.raw_value} {l.unit or ''}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">{l.reference_range or 'Not provided in source report'}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
                <span style="background: {badge_color}20; color: {badge_color}; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; text-transform: uppercase;">
                    {l.flag or 'unspecified'}
                </span>
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">{l.source_document or 'Report'} (p.{l.provenance_page or 1})</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">{l.verification_status.capitalize()}</td>
        </tr>
        """

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MedLens Clinical Dossier — {patient.name}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 40px auto; max-width: 900px; line-height: 1.5; }}
        .header {{ border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }}
        .disclaimer {{ background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; border-radius: 8px; font-size: 12px; margin-bottom: 24px; }}
        .section {{ margin-bottom: 24px; }}
        .section-title {{ font-size: 14px; font-weight: 700; text-transform: uppercase; color: #0f766e; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }}
        table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
        th {{ background: #f8fafc; text-align: left; padding: 8px 12px; border-bottom: 2px solid #cbd5e1; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #475569; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; }}
        @media print {{ body {{ margin: 20px; }} .no-print {{ display: none; }} }}
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #0d9488; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">Print / Save as PDF</button>
    </div>

    <div class="header">
        <div>
            <h1 style="margin: 0; font-size: 24px; color: #0f172a;">MedLens Clinical Summary</h1>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">AI-Powered Clinical Information Intelligence System</p>
        </div>
        <div style="text-align: right; font-size: 12px; color: #64748b;">
            <div><strong>Patient ID:</strong> {patient.patient_identifier}</div>
            <div><strong>Export Date:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</div>
        </div>
    </div>

    <div class="disclaimer">
        <strong>⚠️ CLINICAL INFORMATION NOTICE & BOUNDARIES:</strong>
        This document contains organized clinical data extracted from uploaded records and verified by human practitioners.
        MedLens is strictly an information organization system, NOT a diagnostic system. It does not provide medical diagnoses, treatment plans, or medication prescriptions.
    </div>

    <div class="section">
        <div class="section-title">Patient Profile</div>
        <div class="grid">
            <div>
                <div><strong>Full Name:</strong> {patient.name}</div>
                <div><strong>Date of Birth:</strong> {patient.date_of_birth or 'N/A'} (Age: {patient.age or 'N/A'})</div>
                <div><strong>Sex:</strong> {patient.sex}</div>
                <div><strong>Contact:</strong> {patient.contact_information or 'N/A'}</div>
            </div>
            <div>
                <div><strong>Known Allergies:</strong> {patient.allergies or 'None documented'}</div>
                <div><strong>Current Medications:</strong> {patient.current_medications or 'None documented'}</div>
                <div><strong>Active Conditions:</strong> {patient.medical_conditions or 'None documented'}</div>
                <div><strong>Reported Symptoms:</strong> {patient.symptoms or 'None documented'}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Structured Laboratory Observations</div>
        <table>
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Extracted Value</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                    <th>Source Document</th>
                    <th>Verification</th>
                </tr>
            </thead>
            <tbody>
                {lab_rows if lab_rows else '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">No laboratory results registered.</td></tr>'}
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Medical Reports on File ({len(reports)})</div>
        <ul>
            {''.join([f"<li><strong>{r.title}</strong> ({r.report_type.upper()}) — Report Date: {r.report_date or 'N/A'} — Status: {r.status.capitalize()}</li>" for r in reports])}
        </ul>
    </div>
</body>
</html>
    """
    return Response(content=html_content, media_type="text/html")
