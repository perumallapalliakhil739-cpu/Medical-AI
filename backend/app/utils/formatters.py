"""
Clinical data formatters and sanitizers.
"""

import re
from typing import Optional


def sanitize_filename(filename: str) -> str:
    """Strip dangerous characters from uploaded filenames."""
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    return clean.strip('._')


def format_bytes(size: int) -> str:
    """Format byte size into human-readable string."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if abs(size) < 1024.0:
            return f"{size:3.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} TB"
