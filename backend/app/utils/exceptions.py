"""
Custom domain exceptions for MedLens clinical intelligence platform.
"""


class MedLensException(Exception):
    """Base exception for all MedLens domain errors."""
    def __init__(self, message: str, code: str = "MEDLENS_ERROR", details: dict = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class ClinicalSafetyViolation(MedLensException):
    """Raised if an operation breaches autonomous diagnosis or prescription boundaries."""
    def __init__(self, message: str = "Operation rejected: breaches clinical safety boundaries"):
        super().__init__(message, code="CLINICAL_SAFETY_VIOLATION")


class DatabaseUnavailableError(MedLensException):
    """Raised when critical database connectivity cannot be established."""
    def __init__(self, message: str = "Database connection unavailable"):
        super().__init__(message, code="DATABASE_UNAVAILABLE")


class EntityNotFoundError(MedLensException):
    """Raised when a requested resource does not exist."""
    def __init__(self, entity_type: str, identifier: str):
        super().__init__(f"{entity_type} with id '{identifier}' not found", code="ENTITY_NOT_FOUND")
