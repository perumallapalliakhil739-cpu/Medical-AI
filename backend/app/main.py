"""
MedLens — AI-Powered Clinical Information Intelligence
Backend API Entrypoint
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.safety import (
    CLINICAL_SAFETY_DISCLAIMER,
    SAFETY_BOUNDARIES,
    SAFETY_HTTP_HEADERS
)
from app.database.base import Base
from app.database.session import engine, active_db_type
import app.models  # Ensure all SQLAlchemy models are registered
from app.api.v1.router import api_router
from app.utils.exceptions import MedLensException

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("medlens")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifespan management."""
    logger.info("Initializing MedLens Backend Foundation [Version: %s]...", settings.APP_VERSION)
    logger.info("Clinical Safety Boundary active: %s", CLINICAL_SAFETY_DISCLAIMER)
    logger.info("Active Database Engine: %s", active_db_type)

    # 1. Initialize database tables if not present
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas and foundation tables verified.")
    except Exception as exc:
        logger.error("Failed to initialize database tables: %s", str(exc))

    # 2. Verify and prepare uploads storage directory
    upload_dir = settings.resolved_upload_dir
    logger.info("Clinical document uploads directory verified at: %s", upload_dir)

    # 3. Auto-seed realistic synthetic demo data if database is empty
    try:
        from app.database.session import SessionLocal
        from app.models.patient import Patient
        from app.api.v1.endpoints.seed import seed_demo_data
        with SessionLocal() as db:
            if db.query(Patient).count() == 0:
                logger.info("Fresh database detected; auto-seeding 4 realistic synthetic patients and reports...")
                seed_demo_data(db)
                logger.info("Synthetic demo clinical data seeded successfully.")
    except Exception as seed_exc:
        logger.warning("Could not auto-seed demo data: %s", str(seed_exc))

    yield

    logger.info("Shutting down MedLens Backend...")


# FastAPI Application instance
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "### MedLens — AI-Powered Clinical Information Intelligence\n\n"
        "MedLens is a medical information organization platform that collects patient information, "
        "processes clinical reports, extracts structured provenance-tracked data, compares reports, "
        "and detects inconsistencies.\n\n"
        "**CLINICAL SAFETY MANDATE:**\n"
        "> MedLens does NOT diagnose diseases, prescribe medication, recommend dosage changes, "
        "> formulate treatments, or replace healthcare professionals. All information is organized "
        "> strictly for clinical intelligence and workflow support."
    ),
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_clinical_safety_headers(request: Request, call_next):
    """Append clinical safety advisory headers to every response."""
    response: Response = await call_next(request)
    for header, value in SAFETY_HTTP_HEADERS.items():
        response.headers[header] = value
    return response


# Centralized Exception Handlers (Never expose internal Python stack traces)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Clean validation error formatting without leaking stack traces."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append({"field": loc, "message": err.get("msg", "Invalid input")})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The submitted clinical data failed validation constraints.",
                "details": errors
            }
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Standardized HTTP exception payload."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "details": None
            }
        }
    )


@app.exception_handler(MedLensException)
async def medlens_exception_handler(request: Request, exc: MedLensException):
    """Custom domain exception payload."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all unhandled exception handler ensuring stack traces are logged but never returned."""
    logger.exception("Unhandled server exception processing request %s: %s", request.url, str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please contact the clinical informatics administrator.",
                "details": None
            }
        }
    )


# Include Root API v1 router
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def root_summary():
    """Welcome and quick API index."""
    return {
        "application": settings.APP_NAME,
        "service": "MedLens API",
        "version": settings.APP_VERSION,
        "status": "operational",
        "documentation": "/docs",
        "health_check": "/api/v1/health",
        "safety_boundaries": SAFETY_BOUNDARIES,
        "safety_disclaimer": CLINICAL_SAFETY_DISCLAIMER
    }
