"""
Pydantic schemas for System Settings & Dynamic Configuration (Step 24).
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class SettingsResponse(BaseModel):
    """System configuration and feature flag set."""
    app_name: str = "MedLens"
    tagline: str = "AI-Powered Clinical Information Intelligence"
    theme_color: str = "#0d9488"  # Teal-600
    confidence_threshold_high: float = 0.90
    confidence_threshold_medium: float = 0.70
    supported_file_types: list[str] = Field(default_factory=lambda: [".pdf", ".png", ".jpg", ".jpeg", ".txt", ".json", ".csv"])
    ai_summary_instructions: str = (
        "Describe available findings concisely using cautious language ('The report states...'). "
        "Never diagnose, prescribe, recommend dosage changes, or invent missing information."
    )
    feature_toggles: Dict[str, bool] = Field(
        default_factory=lambda: {
            "patient_intake": True,
            "report_upload": True,
            "ai_summary": True,
            "conflict_detection": True,
            "comparison": True,
            "timeline": True,
            "export": True,
            "side_by_side": True
        }
    )


class SettingsUpdatePayload(BaseModel):
    """Payload to update system settings."""
    app_name: Optional[str] = None
    tagline: Optional[str] = None
    theme_color: Optional[str] = None
    confidence_threshold_high: Optional[float] = None
    confidence_threshold_medium: Optional[float] = None
    ai_summary_instructions: Optional[str] = None
    feature_toggles: Optional[Dict[str, bool]] = None
