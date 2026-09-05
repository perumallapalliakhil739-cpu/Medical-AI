"""
Report Comparison API Endpoints (Step 10).
Compares current vs previous clinical reports, calculates objective numerical deltas,
and formats longitudinal trends without diagnostic speculation.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.user import User
from app.models.report import MedicalReport
from app.models.lab_result import LabResult
from app.models.patient import Patient
from app.core.deps import get_current_user

router = APIRouter()


@router.get(
    "",
    summary="Compare Current vs Previous Medical Reports (Step 10)",
    description="Calculates numerical deltas, percentage shifts, and trends across matching laboratory analytes."
)
def compare_reports(
    current_report_id: str = Query(..., description="ID of latest/current report"),
    previous_report_id: str = Query(..., description="ID of prior baseline report"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Compare two clinical reports."""
    curr_rep = db.query(MedicalReport).filter(MedicalReport.id == current_report_id).first()
    prev_rep = db.query(MedicalReport).filter(MedicalReport.id == previous_report_id).first()

    if not curr_rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Current report not found.")
    if not prev_rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Previous report not found.")

    curr_results = db.query(LabResult).filter(LabResult.report_id == curr_rep.id).all()
    prev_results = db.query(LabResult).filter(LabResult.report_id == prev_rep.id).all()

    # Index prior results by normalized test name
    prev_map = {r.test_name.lower().strip(): r for r in prev_results}

    comparison_items = []
    for curr in curr_results:
        key = curr.test_name.lower().strip()
        prev = prev_map.get(key)

        prev_num = prev.numeric_value if prev else None
        curr_num = curr.numeric_value

        delta = None
        pct_change = None
        trend = "new"

        if prev_num is not None and curr_num is not None:
            delta = round(curr_num - prev_num, 2)
            if prev_num != 0:
                pct_change = round(((curr_num - prev_num) / abs(prev_num)) * 100, 1)

            if abs(delta) < 0.001:
                trend = "stable"
            elif delta > 0:
                trend = "increased"
            else:
                trend = "decreased"

        comparison_items.append({
            "test_name": curr.test_name,
            "unit": curr.unit or (prev.unit if prev else ""),
            "previous_value": prev.raw_value if prev else "N/A",
            "previous_numeric": prev_num,
            "previous_flag": prev.flag if prev else None,
            "previous_reference": prev.reference_range if prev else None,
            "current_value": curr.raw_value,
            "current_numeric": curr_num,
            "current_flag": curr.flag,
            "current_reference": curr.reference_range,
            "change": delta,
            "percent_change": pct_change,
            "trend": trend,
            "observation": f"Numerical change: {'+' if (delta and delta > 0) else ''}{delta}" if delta is not None else "Baseline comparison not available"
        })

    # Fetch longitudinal trends across all patient reports for visualization
    all_patient_reports = []
    if curr_rep.patient_id:
        reps = (
            db.query(MedicalReport)
            .filter(MedicalReport.patient_id == curr_rep.patient_id)
            .order_by(MedicalReport.report_date.asc(), MedicalReport.created_at.asc())
            .all()
        )
        for r in reps:
            labs = db.query(LabResult).filter(LabResult.report_id == r.id).all()
            all_patient_reports.append({
                "report_id": r.id,
                "title": r.title,
                "date": r.report_date or str(r.created_at)[:10],
                "values": {l.test_name.lower(): l.numeric_value for l in labs if l.numeric_value is not None}
            })

    return {
        "current_report": {
            "id": curr_rep.id,
            "title": curr_rep.title,
            "date": curr_rep.report_date,
            "type": curr_rep.report_type
        },
        "previous_report": {
            "id": prev_rep.id,
            "title": prev_rep.title,
            "date": prev_rep.report_date,
            "type": prev_rep.report_type
        },
        "comparisons": comparison_items,
        "historical_series": all_patient_reports,
        "clinical_disclaimer": "This report comparison strictly illustrates numerical deltas and must not be used for autonomous diagnostic conclusions."
    }
