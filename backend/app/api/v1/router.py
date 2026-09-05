"""
Root API v1 router module for MedLens.
Aggregates all clinical information intelligence endpoints.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    system,
    auth,
    patients,
    reports,
    verification,
    conflicts,
    timeline,
    comparison,
    ai,
    export,
    settings,
    seed
)

api_router = APIRouter()

# Diagnostics & Metadata
api_router.include_router(health.router, tags=["System Diagnostics"])
api_router.include_router(system.router, prefix="/system", tags=["System Metadata"])

# Authentication & Access Control (Step 17)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Access"])

# Patient Registry & Intake (Step 2 & 15)
api_router.include_router(patients.router, prefix="/patients", tags=["Patient Registry"])

# Medical Reports & Extraction (Step 3 & 4)
api_router.include_router(reports.router, prefix="/reports", tags=["Medical Reports"])

# Human Verification Center (Step 8 & 14)
api_router.include_router(verification.router, prefix="/verification", tags=["Verification Center"])

# Conflict & Inconsistency Detection (Step 7)
api_router.include_router(conflicts.router, prefix="/conflicts", tags=["Conflict Detection"])

# Patient Chronological Timeline (Step 11)
api_router.include_router(timeline.router, prefix="/timeline", tags=["Patient Timeline"])

# Report Comparison & Trends (Step 10)
api_router.include_router(comparison.router, prefix="/comparison", tags=["Report Comparison"])

# Responsible AI Summary & Text Extraction (Step 9 & 20)
api_router.include_router(ai.router, prefix="/ai", tags=["Responsible AI"])

# Export Suite: PDF, CSV, JSON (Step 23)
api_router.include_router(export.router, prefix="/export", tags=["Export Suite"])

# System Settings & Feature Flags (Step 24)
api_router.include_router(settings.router, prefix="/settings", tags=["System Settings"])

# Synthetic Demo Data Seeder (Step 27)
api_router.include_router(seed.router, prefix="/seed", tags=["Demo Data"])
