@echo off
REM FEB Timing System - Quick Start (Windows Batch)
REM Double-click this file to start everything

setlocal enabledelayedexpansion

cd /d "c:\Users\medved01\OneDrive - TMC\1\FEB timing\FEB-Timing"

echo.
echo ========================================
echo   FEB TIMING SYSTEM - STARTING...
echo ========================================
echo.

REM Kill any existing processes (optional)
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

REM Wait a moment
timeout /t 1 /nobreak >nul

REM Start Backend in new terminal
echo Starting Backend Server (Port 8000)...
start "FEB Backend Server" cmd /k "python -m uvicorn python.receiver:app --host 0.0.0.0 --port 8000"

REM Wait for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend in new terminal
echo Starting Frontend Server (Port 3000)...
start "FEB Frontend Server" cmd /k "npm run dev"

REM Start Laser Gate Monitor in new terminal
echo Starting Laser Gate Monitor (COM7)...
start "FEB Laser Gate Monitor" cmd /k "python read_laser.py"

REM Start Hub Monitor in new terminal
echo Starting Hub Monitor (COM8)...
start "FEB Hub Monitor" cmd /k "python read_hub.py"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

REM Open dashboard
echo Opening Dashboard...
start http://localhost:3000

echo.
echo ========================================
echo   ✓ SYSTEM STARTED (5 Windows)
echo ========================================
echo.
echo Windows:
echo   1. Backend Server (logs)
echo   2. Frontend Server (status)
echo   3. Laser Gate Monitor (COM7 data) ← Watch this
echo   4. Hub Monitor (COM8 data) ← And this
echo   5. Browser (Dashboard)
echo.
echo Dashboard: http://localhost:3000
echo Backend:   http://localhost:8000
echo.
echo ACTION: Break the laser beam and watch both monitor windows!
echo   - COM7 shows laser gate output
echo   - COM8 shows hub receiving data
echo.
pause
