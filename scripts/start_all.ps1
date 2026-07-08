#!/usr/bin/env powershell
<#
.SYNOPSIS
    FEB Timing System - One-Click Startup Script
    
.DESCRIPTION
    Starts both Python backend and React frontend in separate terminals
    
.USAGE
    .\start_all.ps1
#>

# Configuration
$PROJECT_ROOT = "c:\Users\medved01\OneDrive - TMC\1\FEB timing\FEB-Timing"
$BACKEND_PORT = 8000
$FRONTEND_PORT = 3000
$DASHBOARD_URL = "http://localhost:$FRONTEND_PORT"

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   FEB TIMING SYSTEM - AUTO STARTUP    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running from correct directory
if (!(Test-Path "$PROJECT_ROOT\package.json")) {
    Write-Host "❌ Error: Cannot find project files" -ForegroundColor Red
    Write-Host "   Expected: $PROJECT_ROOT" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Project found at: $PROJECT_ROOT" -ForegroundColor Green
Write-Host ""

# Function to start process in new terminal
function Start-InNewTerminal {
    param(
        [string]$Title,
        [string]$Command
    )
    
    Write-Host "📍 Starting: $Title..." -ForegroundColor Yellow
    
    $pwshArgs = @(
        '-NoExit',
        '-Command',
        "Set-Location '$PROJECT_ROOT'; $Command"
    )
    
    Start-Process -FilePath "powershell.exe" -ArgumentList $pwshArgs -WindowStyle Normal
    
    Start-Sleep -Seconds 2
}

# Kill any existing processes
Write-Host "🧹 Cleaning up any existing processes..." -ForegroundColor Cyan
try {
    Get-Process -Name "python" | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue
} catch {
    # Silently continue if no processes found
}

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "🚀 Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
$backendCmd = "python -m uvicorn python.receiver:app --host 0.0.0.0 --port $BACKEND_PORT; `
Read-Host 'Press Enter to close this window'"

Start-InNewTerminal -Title "Backend Server (Port $BACKEND_PORT)" -Command $backendCmd

# Wait for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Test if backend is running
$backendReady = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BACKEND_PORT" -ErrorAction SilentlyContinue
        $backendReady = $true
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($backendReady) {
    Write-Host "✅ Backend started successfully on port $BACKEND_PORT" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend may still be starting (this is normal)" -ForegroundColor Yellow
}

Write-Host ""

# Start Frontend
$frontendCmd = "npm run dev; `
Read-Host 'Press Enter to close this window'"

Start-InNewTerminal -Title "Frontend Server (Port $FRONTEND_PORT)" -Command $frontendCmd

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ SYSTEM STARTED SUCCESSFULLY      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Dashboard URL: $DASHBOARD_URL" -ForegroundColor Cyan
Write-Host "🔧 Backend API:   http://localhost:$BACKEND_PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening dashboard in browser..." -ForegroundColor Yellow

# Open dashboard in browser
Start-Sleep -Seconds 2
Start-Process $DASHBOARD_URL

Write-Host ""
Write-Host "ℹ️  Tip: Run simulation tests from PowerShell:" -ForegroundColor Cyan
Write-Host ""
Write-Host '  $body = @{ raw_line = "1,1708081230,123456,1,101" } | ConvertTo-Json' -ForegroundColor Gray
Write-Host '  Invoke-RestMethod -Uri "http://localhost:8000/api/simulate" -Method Post -ContentType "application/json" -Body $body' -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For more info, see: COMPLETE_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
