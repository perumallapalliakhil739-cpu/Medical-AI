"""
Safe Synthetic Demo Data Seeder (Step 27).
Populates 4 realistic fictional patient dossiers, lab panels, intentional conflicts,
low-confidence extractions, and verification queue items.
"""

import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.report import MedicalReport
from app.models.lab_result import LabResult
from app.models.conflict import Conflict
from app.models.timeline import TimelineEvent
from app.models.system_setting import SystemSetting
from app.core.security import hash_password
from app.services.ai_pipeline import generate_responsible_ai_summary

router = APIRouter()


@router.post(
    "/demo-data",
    summary="Seed Realistic Fictional Demo Data (Step 27)",
    description="Initializes 4 synthetic patient records, multiple lab reports, intentional conflicts, and verification items."
)
def seed_demo_data(db: Session = Depends(get_db)):
    """Seed synthetic clinical data."""
    # 1. Seed or retrieve demo clinician user
    clinician = db.query(User).filter(User.email == "dr.watson@medlens.org").first()
    if not clinician:
        clinician = User(
            email="dr.watson@medlens.org",
            hashed_password=hash_password("MedLens2026!"),
            full_name="Dr. Elena Watson, MD",
            role="clinician",
            institution="Metropolitan Clinical Center",
            license_number="MD-88421",
            account_status="active",
            is_active=True,
            is_verified=True
        )
        db.add(clinician)
        db.commit()
        db.refresh(clinician)

    # Check if patients already seeded
    existing_count = db.query(Patient).count()
    if existing_count >= 4:
        return {
            "status": "already_seeded",
            "message": f"System already contains {existing_count} clinical patients.",
            "patient_count": existing_count
        }

    # -------------------------------------------------------------
    # Patient 1: Sarah Jenkins (Anemia recovery, Allergy conflict, Low-conf item)
    # -------------------------------------------------------------
    p1 = Patient(
        patient_identifier="PT-2026-SJ01",
        name="Sarah Jenkins",
        date_of_birth="1981-06-14",
        age=45,
        sex="Female",
        contact_information="s.jenkins@example.org | (555) 234-8901",
        symptoms="Mild fatigue, intermittent exertional lightheadedness",
        medical_conditions="Iron Deficiency Anemia (under treatment)",
        allergies="Penicillin (moderate cutaneous urticaria)",
        current_medications="Ferrous Sulfate 325mg daily, Multivitamin",
        relevant_medical_history="Postpartum anemia in 2018; unremarkable surgical history",
        family_history="Maternal history of osteoporosis; non-contributory cardiovascular history",
        field_sources=json.dumps({
            "name": "User Provided",
            "age": "User Provided",
            "allergies": "Human Verified",
            "current_medications": "User Provided"
        }),
        created_by_user_id=clinician.id
    )
    db.add(p1)
    db.commit()
    db.refresh(p1)

    # Report 1.1: Prior CBC (Jan 15, 2026)
    r1_1 = MedicalReport(
        patient_id=p1.id,
        title="Complete Blood Count (Baseline)",
        report_type="cbc",
        source_filename="Sarah_Jenkins_CBC_2026-01-15.pdf",
        file_path="../uploads/demo_sj_cbc_baseline.pdf",
        file_size_bytes=142800,
        mime_type="application/pdf",
        report_date="2026-01-15",
        status="extracted",
        verification_status="verified",
        extraction_confidence=0.97,
        checksum="a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
        notes="Baseline pre-iron supplementation panel"
    )
    db.add(r1_1)
    db.commit()
    db.refresh(r1_1)

    p1_baseline_labs = [
        ("Hemoglobin", "718-7", "11.4", 11.4, "g/dL", "12.0-16.0", "low", 0.98, "verified"),
        ("Hematocrit", "20570-8", "34.2", 34.2, "%", "37.0-48.0", "low", 0.97, "verified"),
        ("RBC", "789-8", "3.90", 3.90, "M/mcL", "4.20-5.40", "low", 0.96, "verified"),
        ("WBC", "6690-2", "6800", 6800, "cells/mcL", "4500-11000", "normal", 0.97, "verified"),
        ("Platelets", "777-3", "220", 220, "K/mcL", "150-450", "normal", 0.96, "verified"),
    ]
    for name, code, raw_v, num_v, unit, ref_r, flag, conf, v_stat in p1_baseline_labs:
        db.add(LabResult(
            report_id=r1_1.id,
            patient_id=p1.id,
            test_name=name,
            analyte_code=code,
            raw_value=raw_v,
            numeric_value=num_v,
            unit=unit,
            reference_range=ref_r,
            reference_range_source=f"Document Table Header, {r1_1.source_filename}",
            flag=flag,
            confidence_score=conf,
            source_type="Extracted from Report",
            source_document=r1_1.source_filename,
            provenance_page=1,
            report_date="2026-01-15",
            verification_status=v_stat
        ))

    # Report 1.2: Follow-up CBC & Iron Studies (May 10, 2026)
    r1_2 = MedicalReport(
        patient_id=p1.id,
        title="Repeat CBC & Serum Ferritin Panel",
        report_type="cbc",
        source_filename="Sarah_Jenkins_CBC_Followup_2026-05-10.pdf",
        file_path="../uploads/demo_sj_cbc_followup.pdf",
        file_size_bytes=158200,
        mime_type="application/pdf",
        report_date="2026-05-10",
        status="extracted",
        verification_status="pending",
        extraction_confidence=0.88,
        checksum="b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01",
        notes="Post-therapy evaluation"
    )
    db.add(r1_2)
    db.commit()
    db.refresh(r1_2)

    p1_followup_labs = [
        ("Hemoglobin", "718-7", "12.8", 12.8, "g/dL", "12.0-16.0", "normal", 0.98, "verified"),
        ("Hematocrit", "20570-8", "38.5", 38.5, "%", "37.0-48.0", "normal", 0.97, "verified"),
        ("RBC", "789-8", "4.35", 4.35, "M/mcL", "4.20-5.40", "normal", 0.96, "verified"),
        ("WBC", "6690-2", "7200", 7200, "cells/mcL", "4500-11000", "normal", 0.95, "verified"),
        ("Platelets", "777-3", "245", 245, "K/mcL", "150-450", "normal", 0.95, "verified"),
        # Strict Reference Range Awareness & Low Confidence test case:
        ("Serum Ferritin", "2276-4", "45", 45.0, "ng/mL", "Reference Range: Not provided in source report", "unspecified", 0.68, "pending")
    ]
    for name, code, raw_v, num_v, unit, ref_r, flag, conf, v_stat in p1_followup_labs:
        db.add(LabResult(
            report_id=r1_2.id,
            patient_id=p1.id,
            test_name=name,
            analyte_code=code,
            raw_value=raw_v,
            numeric_value=num_v,
            unit=unit,
            reference_range=ref_r,
            reference_range_source="Not provided in source report" if "Not provided" in ref_r else f"Table Header, {r1_2.source_filename}",
            flag=flag,
            confidence_score=conf,
            source_type="Extracted from Report",
            source_document=r1_2.source_filename,
            provenance_page=1,
            report_date="2026-05-10",
            verification_status=v_stat,
            observation="Low confidence extraction; requires clinician verification." if conf < 0.70 else None
        ))

    # Conflict for Sarah Jenkins: Allergy vs Uploaded Report Medication
    c1 = Conflict(
        patient_id=p1.id,
        source_report_a_id=r1_2.id,
        conflict_type="allergy_medication_conflict",
        severity="critical",
        description=(
            "Clinical Inconsistency Flagged: Patient Profile documents active allergy to 'Penicillin', "
            "while uploaded clinical report mentions 'Amoxicillin 500mg TID'. "
            "Please verify patient allergy status with prescribing clinician."
        ),
        status="detected"
    )
    db.add(c1)

    # Timeline events for Sarah
    db.add(TimelineEvent(
        patient_id=p1.id,
        source_report_id=r1_1.id,
        event_date=datetime(2026, 1, 15, 9, 30, tzinfo=timezone.utc),
        event_type="lab_test",
        title="Baseline Complete Blood Count",
        summary="Initial CBC revealed mild microcytic anemia (Hemoglobin 11.4 g/dL).",
        facility="Metropolitan Outpatient Lab"
    ))
    db.add(TimelineEvent(
        patient_id=p1.id,
        source_report_id=r1_2.id,
        event_date=datetime(2026, 5, 10, 11, 0, tzinfo=timezone.utc),
        event_type="lab_test",
        title="Follow-up CBC & Ferritin Report",
        summary="Hemoglobin improved to 12.8 g/dL (+1.4 g/dL). Ferritin extracted without source reference range.",
        facility="Metropolitan Outpatient Lab"
    ))

    # -------------------------------------------------------------
    # Patient 2: Robert Chen (Age Discrepancy Conflict)
    # -------------------------------------------------------------
    p2 = Patient(
        patient_identifier="PT-2026-RC02",
        name="Robert Chen",
        date_of_birth="1974-04-12",
        age=52,
        sex="Male",
        contact_information="r.chen@enterprise.com | (555) 432-1098",
        symptoms="Polydipsia, nocturia, mild lower extremity edema",
        medical_conditions="Type 2 Diabetes Mellitus, Essential Hypertension",
        allergies="Sulfa drugs (facial edema)",
        current_medications="Metformin 1000mg BID, Lisinopril 20mg daily",
        relevant_medical_history="Diagnosed T2D in 2019; annual retinopathy screening up to date",
        family_history="Paternal history of stroke at age 68",
        field_sources=json.dumps({
            "name": "User Provided",
            "age": "User Provided",
            "medical_conditions": "Human Verified"
        }),
        created_by_user_id=clinician.id
    )
    db.add(p2)
    db.commit()
    db.refresh(p2)

    r2_1 = MedicalReport(
        patient_id=p2.id,
        title="Comprehensive Metabolic Panel & Glycemic Control",
        report_type="metabolic",
        source_filename="Robert_Chen_CMP_2026-03-02.pdf",
        file_path="../uploads/demo_rc_cmp.pdf",
        file_size_bytes=184000,
        mime_type="application/pdf",
        report_date="2026-03-02",
        status="extracted",
        verification_status="verified",
        extraction_confidence=0.96,
        checksum="c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012",
        notes="Routine diabetic management panel"
    )
    db.add(r2_1)
    db.commit()
    db.refresh(r2_1)

    p2_labs = [
        ("Glucose", "2345-7", "142", 142.0, "mg/dL", "70-100", "high", 0.98, "verified"),
        ("HbA1c", "4548-4", "7.2", 7.2, "%", "4.0-5.6", "high", 0.97, "verified"),
        ("Creatinine", "2160-0", "1.1", 1.1, "mg/dL", "0.7-1.3", "normal", 0.95, "verified"),
        ("BUN", "3094-0", "18", 18.0, "mg/dL", "7-20", "normal", 0.96, "verified"),
        ("Sodium", "2951-2", "139", 139.0, "mEq/L", "135-145", "normal", 0.97, "verified"),
        ("Potassium", "2823-3", "4.4", 4.4, "mEq/L", "3.5-5.0", "normal", 0.96, "verified")
    ]
    for name, code, raw_v, num_v, unit, ref_r, flag, conf, v_stat in p2_labs:
        db.add(LabResult(
            report_id=r2_1.id,
            patient_id=p2.id,
            test_name=name,
            analyte_code=code,
            raw_value=raw_v,
            numeric_value=num_v,
            unit=unit,
            reference_range=ref_r,
            reference_range_source=f"Document Table Header, {r2_1.source_filename}",
            flag=flag,
            confidence_score=conf,
            source_type="Extracted from Report",
            source_document=r2_1.source_filename,
            report_date="2026-03-02",
            verification_status=v_stat
        ))

    # Age conflict for Robert Chen
    c2 = Conflict(
        patient_id=p2.id,
        source_report_a_id=r2_1.id,
        conflict_type="demographic_age_mismatch",
        severity="high",
        description=(
            "Information Conflict Detected: Patient Profile records chronological age as 52, "
            "while uploaded laboratory requisition specifies age as 45. "
            "Please verify the correct demographic record."
        ),
        status="detected"
    )
    db.add(c2)

    db.add(TimelineEvent(
        patient_id=p2.id,
        source_report_id=r2_1.id,
        event_date=datetime(2026, 3, 2, 8, 15, tzinfo=timezone.utc),
        event_type="lab_test",
        title="Quarterly Glycemic & Renal Panel",
        summary="Fasting glucose elevated at 142 mg/dL; HbA1c 7.2%. Renal indices stable.",
        facility="Endocrine Diagnostic Associates"
    ))

    # -------------------------------------------------------------
    # Patient 3: Maria Rodriguez (Lipid Panel comparison)
    # -------------------------------------------------------------
    p3 = Patient(
        patient_identifier="PT-2026-MR03",
        name="Maria Rodriguez",
        date_of_birth="1965-11-28",
        age=61,
        sex="Female",
        contact_information="m.rodriguez@family.net | (555) 789-0123",
        symptoms="Asymptomatic routine screening",
        medical_conditions="Hyperlipidemia, Osteopenia",
        allergies="No known drug allergies (NKDA)",
        current_medications="Atorvastatin 20mg daily, Calcium + Vitamin D",
        relevant_medical_history="Cholecystectomy in 2015",
        family_history="Strong maternal history of CAD",
        field_sources=json.dumps({
            "name": "User Provided",
            "age": "User Provided",
            "allergies": "Human Verified"
        }),
        created_by_user_id=clinician.id
    )
    db.add(p3)
    db.commit()
    db.refresh(p3)

    # Report 3.1: Baseline Lipid (Feb 14, 2026)
    r3_1 = MedicalReport(
        patient_id=p3.id,
        title="Fasting Lipid Profile (Baseline)",
        report_type="lipid",
        source_filename="Maria_Rodriguez_Lipid_2026-02-14.pdf",
        file_path="../uploads/demo_mr_lipid_baseline.pdf",
        file_size_bytes=132000,
        mime_type="application/pdf",
        report_date="2026-02-14",
        status="extracted",
        verification_status="verified",
        extraction_confidence=0.96,
        checksum="d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0123",
        notes="Pre-statin titration lipid panel"
    )
    db.add(r3_1)
    db.commit()
    db.refresh(r3_1)

    p3_baseline_labs = [
        ("Total Cholesterol", "2093-3", "245", 245.0, "mg/dL", "< 200", "high", 0.97, "verified"),
        ("Triglycerides", "2571-8", "210", 210.0, "mg/dL", "< 150", "high", 0.95, "verified"),
        ("HDL Cholesterol", "2085-9", "42", 42.0, "mg/dL", "> 40", "normal", 0.96, "verified"),
        ("LDL Cholesterol", "13457-7", "161", 161.0, "mg/dL", "< 100", "high", 0.95, "verified")
    ]
    for name, code, raw_v, num_v, unit, ref_r, flag, conf, v_stat in p3_baseline_labs:
        db.add(LabResult(
            report_id=r3_1.id,
            patient_id=p3.id,
            test_name=name,
            analyte_code=code,
            raw_value=raw_v,
            numeric_value=num_v,
            unit=unit,
            reference_range=ref_r,
            reference_range_source=f"Document Table Header, {r3_1.source_filename}",
            flag=flag,
            confidence_score=conf,
            source_type="Extracted from Report",
            source_document=r3_1.source_filename,
            report_date="2026-02-14",
            verification_status=v_stat
        ))

    # Report 3.2: Follow-up Lipid (Aug 20, 2026)
    r3_2 = MedicalReport(
        patient_id=p3.id,
        title="Fasting Lipid Profile (Post-Therapy Follow-up)",
        report_type="lipid",
        source_filename="Maria_Rodriguez_Lipid_2026-08-20.pdf",
        file_path="../uploads/demo_mr_lipid_followup.pdf",
        file_size_bytes=136500,
        mime_type="application/pdf",
        report_date="2026-08-20",
        status="extracted",
        verification_status="verified",
        extraction_confidence=0.97,
        checksum="e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01234",
        notes="6-month statin titration reassessment"
    )
    db.add(r3_2)
    db.commit()
    db.refresh(r3_2)

    p3_followup_labs = [
        ("Total Cholesterol", "2093-3", "195", 195.0, "mg/dL", "< 200", "normal", 0.98, "verified"),
        ("Triglycerides", "2571-8", "155", 155.0, "mg/dL", "< 150", "high", 0.96, "verified"),
        ("HDL Cholesterol", "2085-9", "46", 46.0, "mg/dL", "> 40", "normal", 0.96, "verified"),
        ("LDL Cholesterol", "13457-7", "118", 118.0, "mg/dL", "< 100", "high", 0.97, "verified")
    ]
    for name, code, raw_v, num_v, unit, ref_r, flag, conf, v_stat in p3_followup_labs:
        db.add(LabResult(
            report_id=r3_2.id,
            patient_id=p3.id,
            test_name=name,
            analyte_code=code,
            raw_value=raw_v,
            numeric_value=num_v,
            unit=unit,
            reference_range=ref_r,
            reference_range_source=f"Document Table Header, {r3_2.source_filename}",
            flag=flag,
            confidence_score=conf,
            source_type="Extracted from Report",
            source_document=r3_2.source_filename,
            report_date="2026-08-20",
            verification_status=v_stat
        ))

    db.add(TimelineEvent(
        patient_id=p3.id,
        source_report_id=r3_1.id,
        event_date=datetime(2026, 2, 14, 10, 0, tzinfo=timezone.utc),
        event_type="lab_test",
        title="Baseline Lipid Panel",
        summary="Total cholesterol 245 mg/dL, LDL 161 mg/dL.",
        facility="Cardiovascular Health Center"
    ))
    db.add(TimelineEvent(
        patient_id=p3.id,
        source_report_id=r3_2.id,
        event_date=datetime(2026, 8, 20, 10, 30, tzinfo=timezone.utc),
        event_type="lab_test",
        title="Follow-up Lipid Reassessment",
        summary="Total cholesterol reduced to 195 mg/dL (-50 mg/dL), LDL reduced to 118 mg/dL (-43 mg/dL).",
        facility="Cardiovascular Health Center"
    ))

    # -------------------------------------------------------------
    # Patient 4: David Patel (Pending verification items)
    # -------------------------------------------------------------
    p4 = Patient(
        patient_identifier="PT-2026-DP04",
        name="David Patel",
        date_of_birth="1988-09-03",
        age=38,
        sex="Male",
        contact_information="d.patel@techsolutions.io | (555) 901-2345",
        symptoms="General wellness exam; mild seasonal allergies",
        medical_conditions="None documented",
        allergies="Environmental pollen",
        current_medications="Cetirizine 10mg PRN",
        relevant_medical_history="Unremarkable",
        family_history="No significant hereditary risk factors",
        field_sources=json.dumps({
            "name": "User Provided",
            "age": "User Provided"
        }),
        created_by_user_id=clinician.id
    )
    db.add(p4)
    db.commit()
    db.refresh(p4)

    r4 = MedicalReport(
        patient_id=p4.id,
        title="Annual Wellness Metabolic Screen",
        report_type="metabolic",
        source_filename="David_Patel_Wellness_2026-09-01.pdf",
        file_path="../uploads/demo_dp_wellness.pdf",
        file_size_bytes=147000,
        mime_type="application/pdf",
        report_date="2026-09-01",
        status="extracted",
        verification_status="pending",
        extraction_confidence=0.89,
        checksum="f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01234567",
        notes="Recent annual health assessment report requiring review"
    )
    db.add(r4)
    db.commit()
    db.refresh(r4)

    p4_labs = [
        ("Glucose", "2345-7", "92", 92.0, "mg/dL", "70-100", "normal", 0.98, "pending"),
        ("Creatinine", "2160-0", "0.98", 0.98, "mg/dL", "0.7-1.3", "normal", 0.97, "pending"),
        ("BUN", "3094-0", "15", 15.0, "mg/dL", "7-20", "normal", 0.96, "pending"),
        ("Total Protein", "2885-2", "7.1", 7.1, "g/dL", "6.0-8.3", "normal", 0.94, "pending"),
        ("Albumin", "1751-7", "4.4", 4.4, "g/dL", "3.5-5.0", "normal", 0.95, "pending")
    ]
    for name, code, raw_v, num_v, unit, ref_r, flag, conf, v_stat in p4_labs:
        db.add(LabResult(
            report_id=r4.id,
            patient_id=p4.id,
            test_name=name,
            analyte_code=code,
            raw_value=raw_v,
            numeric_value=num_v,
            unit=unit,
            reference_range=ref_r,
            reference_range_source=f"Document Table Header, {r4.source_filename}",
            flag=flag,
            confidence_score=conf,
            source_type="Extracted from Report",
            source_document=r4.source_filename,
            report_date="2026-09-01",
            verification_status=v_stat
        ))

    db.add(TimelineEvent(
        patient_id=p4.id,
        source_report_id=r4.id,
        event_date=datetime(2026, 9, 1, 14, 0, tzinfo=timezone.utc),
        event_type="consultation",
        title="Annual Executive Physical & Metabolic Panel",
        summary="Comprehensive physical exam completed; laboratory results awaiting clinician review.",
        facility="Premier Health Institute"
    ))

    # Generate AI Summaries for each report
    for rep in [r1_1, r1_2, r2_1, r3_1, r3_2, r4]:
        labs = db.query(LabResult).filter(LabResult.report_id == rep.id).all()
        lab_dicts = [
            {"test_name": l.test_name, "raw_value": l.raw_value, "unit": l.unit, "flag": l.flag, "reference_range": l.reference_range}
            for l in labs
        ]
        pat = db.query(Patient).filter(Patient.id == rep.patient_id).first()
        rep.ai_summary = generate_responsible_ai_summary(pat.name if pat else "Patient", lab_dicts, rep.title)

    db.commit()

    return {
        "status": "success",
        "message": "Successfully seeded 4 synthetic clinical patients with longitudinal reports, conflicts, and verification items.",
        "patient_count": 4,
        "reports_count": 6,
        "conflicts_count": 2
    }


@router.get(
    "/status",
    summary="Check Demo Data Status",
    description="Returns current count of patients and reports in the database."
)
def check_demo_status(db: Session = Depends(get_db)):
    """Check if database is populated."""
    patient_count = db.query(Patient).count()
    report_count = db.query(MedicalReport).count()
    conflict_count = db.query(Conflict).count()
    pending_verifications = db.query(LabResult).filter(LabResult.verification_status == "pending").count()

    return {
        "is_seeded": patient_count >= 3,
        "patient_count": patient_count,
        "report_count": report_count,
        "conflict_count": conflict_count,
        "pending_verifications": pending_verifications
    }
