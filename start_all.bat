@echo off
echo ===================================================
echo Starting MedLens Platform Locally
echo ===================================================
start "MedLens Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"
start "MedLens Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 5173"
echo.
echo Both backend and frontend servers are launching!
echo Backend:  http://localhost:8000 (Swagger: http://localhost:8000/docs)
echo Frontend: http://localhost:5173
echo.
pause
