@echo off
echo Starting MedLens Backend (FastAPI + Uvicorn)...
cd /d %~dp0backend
python -m uvicorn app.main:app --reload --port 8000
pause
