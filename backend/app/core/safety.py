"""
MedLens Safety Policy and Clinical Boundary Enforcement.

CRITICAL ARCHITECTURAL CONSTRAINTS:
1. MedLens does NOT diagnose diseases or health conditions.
2. MedLens does NOT prescribe medications or pharmaceutical products.
3. MedLens does NOT recommend dosage adjustments or schedules.
4. MedLens does NOT formulate treatment plans or clinical protocols.
5. MedLens does NOT replace physicians, nurses, pharmacists, or certified healthcare providers.

PURPOSE:
MedLens is strictly a clinical information organization, aggregation, report comparison,
provenance tracking, and discrepancy detection platform designed to assist workflows,
not generate autonomous medical diagnoses or care instructions.
"""

from typing import Final, Dict, Any

CLINICAL_SAFETY_DISCLAIMER: Final[str] = (
    "NOTICE: MedLens is an assistive clinical information organization platform. "
    "MedLens DOES NOT diagnose diseases, prescribe medication, recommend dosage changes, "
    "or prescribe treatments. All data, structured extractions, and summaries must be "
    "reviewed by a certified healthcare professional before making any clinical decisions. "
    "MedLens is not a substitute for professional medical judgment."
)

SAFETY_BOUNDARIES: Final[Dict[str, Any]] = {
    "autonomous_diagnosis_allowed": False,
    "medication_prescription_allowed": False,
    "dosage_alteration_allowed": False,
    "treatment_protocol_generation_allowed": False,
    "healthcare_provider_replacement_allowed": False,
    "human_in_the_loop_required": True,
    "provenance_tracking_enforced": True,
}

SAFETY_HTTP_HEADERS: Final[Dict[str, str]] = {
    "X-MedLens-Safety-Notice": "Clinical Information Organization Only - Not for Autonomous Medical Diagnosis",
    "X-MedLens-HIPAA-Readiness": "Protected Health Information Governance Enforced",
}
