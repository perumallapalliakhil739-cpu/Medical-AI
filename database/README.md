# MedLens Database Setup & Configuration

This directory contains the database initialization, schema definitions, and migration guidelines for **MedLens**.

## Supported Databases

- **PostgreSQL 16+** (Primary Production & Dockerized Development Engine)
  - Extensions utilized: `uuid-ossp` (cryptographic UUIDs), `pg_trgm` (fuzzy clinical text matching).
  - Driver: `psycopg` (v3 modern async/sync binary driver) via SQLAlchemy 2.0+.
- **SQLite 3** (Standalone Local Development Fallback)
  - Enables immediate zero-dependency backend testing without needing a running PostgreSQL instance.
  - Automatically configured when PostgreSQL connection is unavailable in development mode.

## Starting PostgreSQL with Docker Compose

To start the PostgreSQL container:

```bash
docker compose up -d postgres
```

The database container exposes port `5432` and mounts `./database/init.sql` to initialize tables, schemas, and extensions.

## Default Connection Strings

- **PostgreSQL**: `postgresql+psycopg://medlens_user:medlens_password@localhost:5432/medlens_db`
- **SQLite (Fallback)**: `sqlite:///../database/medlens.db`
