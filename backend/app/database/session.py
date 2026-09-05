"""
Database session and engine management for MedLens.
Supports PostgreSQL (via psycopg) and local SQLite fallback for isolated development.
"""

import logging
import socket
import urllib.parse
from pathlib import Path
from typing import Generator, Tuple
from sqlalchemy import create_engine, text, Engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("medlens.database")


def is_postgres_reachable(url: str, timeout: float = 0.5) -> bool:
    """Fast socket probe to check if PostgreSQL server is accepting connections."""
    try:
        parsed = urllib.parse.urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (OSError, TimeoutError):
        return False
    except Exception:
        return False


def get_sqlite_fallback_engine() -> Tuple[Engine, str]:
    """Initialize local SQLite development database."""
    base_dir = Path(__file__).resolve().parent.parent.parent
    db_file = (base_dir / "../database/medlens.db").resolve()
    db_file.parent.mkdir(parents=True, exist_ok=True)
    fallback_url = f"sqlite:///{db_file}"

    fallback_engine = create_engine(
        fallback_url,
        connect_args={"check_same_thread": False}
    )
    with fallback_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Connected to local SQLite database: %s", fallback_url)
    return fallback_engine, "SQLite (Local Development Fallback)"


def create_db_engine() -> Tuple[Engine, str]:
    """
    Attempt to initialize the primary PostgreSQL database engine.
    If unavailable and AUTO_FALLBACK_SQLITE is enabled, fall back to SQLite immediately.
    Returns (engine, engine_type_description).
    """
    primary_url = settings.DATABASE_URL
    is_sqlite = primary_url.startswith("sqlite")

    if is_sqlite:
        engine = create_engine(
            primary_url,
            connect_args={"check_same_thread": False}
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to primary database: SQLite (%s)", primary_url)
        return engine, "SQLite (Primary)"

    # PostgreSQL: fast probe to avoid long socket timeout hangs
    if not is_postgres_reachable(primary_url, timeout=0.5):
        if settings.AUTO_FALLBACK_SQLITE:
            logger.warning(
                "PostgreSQL host is unreachable at %s. Engaging local SQLite fallback for development.",
                primary_url.split("@")[-1]
            )
            return get_sqlite_fallback_engine()
        else:
            raise ConnectionError(f"PostgreSQL server unreachable at {primary_url}")

    # Connect to reachable PostgreSQL
    try:
        engine = create_engine(
            primary_url,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_pre_ping=True
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to primary database: PostgreSQL (%s)", primary_url.split("@")[-1])
        return engine, "PostgreSQL 16+"
    except Exception as exc:
        logger.warning("Failed to connect to PostgreSQL: %s", str(exc))
        if settings.AUTO_FALLBACK_SQLITE:
            return get_sqlite_fallback_engine()
        raise exc


# Initialize engine and sessionmaker
engine, active_db_type = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency for database sessions with safe auto-close."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_database_connection() -> dict:
    """Diagnostic function returning connection health, dialect, and latency."""
    import time
    start_time = time.perf_counter()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "status": "connected" if result == 1 else "unexpected_result",
                "engine": active_db_type,
                "dialect": engine.dialect.name,
                "latency_ms": latency_ms,
                "error": None
            }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "error",
            "engine": active_db_type,
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms,
            "error": str(exc)
        }
