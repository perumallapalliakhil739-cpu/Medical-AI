"""
Centralized structured logger for MedLens backend.
"""

import logging
import sys


def setup_logger(name: str = "medlens", debug: bool = False) -> logging.Logger:
    """Configure standardized logger with clean format."""
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if debug else logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
        ))
        logger.addHandler(handler)

    return logger
