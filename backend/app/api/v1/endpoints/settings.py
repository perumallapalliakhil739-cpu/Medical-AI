"""
Settings and Dynamic Customization Endpoints (Step 24).
Provides runtime control over application branding, themes, confidence thresholds,
AI instructions, and modular feature toggles.
"""

import json
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.system_setting import SystemSetting
from app.schemas.settings import SettingsResponse, SettingsUpdatePayload
from app.services.audit_service import log_audit_event
from app.core.deps import get_current_user

router = APIRouter()

DEFAULT_CONFIG = {
    "app_name": "MedLens",
    "tagline": "AI-Powered Clinical Information Intelligence",
    "theme_color": "#0d9488",
    "confidence_threshold_high": 0.90,
    "confidence_threshold_medium": 0.70,
    "supported_file_types": [".pdf", ".png", ".jpg", ".jpeg", ".txt", ".json", ".csv"],
    "ai_summary_instructions": (
        "Describe available findings concisely using cautious language ('The report states...'). "
        "Never diagnose, prescribe, recommend dosage changes, or invent missing information."
    ),
    "feature_toggles": {
        "patient_intake": True,
        "report_upload": True,
        "ai_summary": True,
        "conflict_detection": True,
        "comparison": True,
        "timeline": True,
        "export": True,
        "side_by_side": True
    }
}


@router.get(
    "",
    response_model=SettingsResponse,
    summary="Get System Settings & Feature Toggles (Step 24)",
    description="Fetches current runtime configuration, confidence thresholds, theme parameters, and active feature flags."
)
def get_settings(db: Session = Depends(get_db)) -> SettingsResponse:
    """Retrieve system configuration."""
    row = db.query(SystemSetting).filter(SystemSetting.key == "app_configuration").first()
    if not row:
        # Create default config record
        row = SystemSetting(
            key="app_configuration",
            value=json.dumps(DEFAULT_CONFIG),
            category="core",
            description="Global runtime settings, thresholds, and feature flags."
        )
        db.add(row)
        db.commit()
        db.refresh(row)

    data = json.loads(row.value)
    return SettingsResponse(**data)


@router.put(
    "",
    response_model=SettingsResponse,
    summary="Update System Settings & Feature Toggles",
    description="Updates branding, confidence thresholds, AI instructions, and feature flags in persistent storage."
)
def update_settings(
    payload: SettingsUpdatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> SettingsResponse:
    """Update settings."""
    row = db.query(SystemSetting).filter(SystemSetting.key == "app_configuration").first()
    data = json.loads(row.value) if row else DEFAULT_CONFIG.copy()

    if payload.app_name is not None:
        data["app_name"] = payload.app_name.strip()
    if payload.tagline is not None:
        data["tagline"] = payload.tagline.strip()
    if payload.theme_color is not None:
        data["theme_color"] = payload.theme_color.strip()
    if payload.confidence_threshold_high is not None:
        data["confidence_threshold_high"] = payload.confidence_threshold_high
    if payload.confidence_threshold_medium is not None:
        data["confidence_threshold_medium"] = payload.confidence_threshold_medium
    if payload.ai_summary_instructions is not None:
        data["ai_summary_instructions"] = payload.ai_summary_instructions.strip()
    if payload.feature_toggles is not None:
        data["feature_toggles"] = payload.feature_toggles

    if not row:
        row = SystemSetting(key="app_configuration", value=json.dumps(data), category="core")
        db.add(row)
    else:
        row.value = json.dumps(data)

    db.commit()
    db.refresh(row)

    log_audit_event(
        db=db,
        action="UPDATE_SETTINGS",
        entity_type="system_settings",
        entity_id="app_configuration",
        user_id=current_user.id,
        details={"updated_keys": list(payload.model_dump(exclude_unset=True).keys())}
    )

    return SettingsResponse(**data)
