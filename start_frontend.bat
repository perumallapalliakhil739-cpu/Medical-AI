@echo off
echo Starting MedLens Frontend (Vite + React)...
cd /d %~dp0frontend
npm run dev -- --port 5173
pause
