"""
Reference Range Intelligence Service (Step 5).
Strict reference-range evaluation without hallucination or invented data.
"""

import re
from typing import Optional, Tuple


def evaluate_reference_range(
    value: Optional[float],
    range_str: Optional[str]
) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Evaluates a numeric test result against a source-provided reference range.
    
    Returns:
        (flag, normalized_range_str, source_explanation)
        flag: 'normal', 'low', 'high', 'critical', or 'unspecified'
    
    CRITICAL SAFETY RULES (Step 5 & Step 21):
    1. NEVER invent or hallucinate reference ranges.
    2. If source report has no reference range, return "Reference Range: Not provided in source report"
       and flag 'unspecified'. Do NOT falsely classify as normal/low/high.
    3. Preserve the original source range format.
    """
    if not range_str or not range_str.strip():
        return (
            "unspecified",
            "Reference Range: Not provided in source report",
            "Source document did not contain a reference range for this analyte."
        )

    clean_range = range_str.strip()
    if clean_range.lower() in [
        "not provided",
        "none",
        "n/a",
        "reference range: not provided in source report",
        "not provided in source report"
    ]:
        return (
            "unspecified",
            "Reference Range: Not provided in source report",
            "Source document did not contain a reference range for this analyte."
        )

    if value is None:
        return ("unspecified", clean_range, "Value is non-numeric; qualitative assessment required.")

    # Match intervals: "13.0 - 17.0", "70–100", "0.5 to 1.2", "4.0 - 5.5"
    interval_match = re.search(
        r"([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|—|to)\s*([0-9]+(?:\.[0-9]+)?)",
        clean_range,
        re.IGNORECASE
    )
    if interval_match:
        try:
            low_bound = float(interval_match.group(1))
            high_bound = float(interval_match.group(2))

            if value < low_bound:
                return ("low", clean_range, f"Value ({value}) is below report reference range [{low_bound} – {high_bound}].")
            elif value > high_bound:
                return ("high", clean_range, f"Value ({value}) is above report reference range [{low_bound} – {high_bound}].")
            else:
                return ("normal", clean_range, f"Value ({value}) is within report reference range [{low_bound} – {high_bound}].")
        except (ValueError, IndexError):
            pass

    # Match upper limit: "< 200", "<= 100", "less than 150"
    less_than_match = re.search(r"(?:<|<=|less\s+than)\s*([0-9]+(?:\.[0-9]+)?)", clean_range, re.IGNORECASE)
    if less_than_match:
        try:
            high_bound = float(less_than_match.group(1))
            if value > high_bound:
                return ("high", clean_range, f"Value ({value}) exceeds threshold (< {high_bound}).")
            else:
                return ("normal", clean_range, f"Value ({value}) is within threshold (< {high_bound}).")
        except ValueError:
            pass

    # Match lower limit: "> 40", ">= 50", "greater than 60"
    greater_than_match = re.search(r"(?:>|>=|greater\s+than)\s*([0-9]+(?:\.[0-9]+)?)", clean_range, re.IGNORECASE)
    if greater_than_match:
        try:
            low_bound = float(greater_than_match.group(1))
            if value < low_bound:
                return ("low", clean_range, f"Value ({value}) is below threshold (> {low_bound}).")
            else:
                return ("normal", clean_range, f"Value ({value}) meets threshold (> {low_bound}).")
        except ValueError:
            pass

    # If format is unrecognized, preserve text as-is and mark unspecified
    return (
        "unspecified",
        clean_range,
        "Custom or non-standard reference interval format; practitioner verification recommended."
    )
