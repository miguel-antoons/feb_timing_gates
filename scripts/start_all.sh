#!/bin/bash
# FEB Timing System - Quick Start (Linux/macOS)
# Run this script to start everything

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

clear

echo "========================================"
echo "  FEB TIMING SYSTEM - STARTING..."
echo "========================================"
echo ""

# Kill any existing processes (optional)
echo "Killing existing processes..."
pkill -f "uvicorn" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 1

# Create a temporary directory for logs
mkdir -p "$PROJECT_ROOT/logs"

# Function to start backend
echo "Starting Backend Server (Port 8000)..."
(
  cd "$PROJECT_ROOT/src/backend"
  uv run uvicorn receiver:app --host 0.0.0.0 --port 8000
) > "$PROJECT_ROOT/logs/backend.log" 2>&1 &

BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait for backend to initialize
sleep 3

# Function to start frontend
echo "Starting Frontend Server (Port 3000)..."
(
  cd "$PROJECT_ROOT/src/frontend"
  npm run dev
) > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &

FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to start
sleep 5

# Open dashboard in default browser
echo "Opening Dashboard..."
if command -v xdg-open &> /dev/null; then
  xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
  open http://localhost:3000
else
  echo "Could not detect browser. Please open http://localhost:3000 manually."
fi

echo ""
echo "========================================"
echo "  ✓ SYSTEM STARTED"
echo "========================================"
echo ""
echo "Terminals:"
echo "  1. Backend Server (PID: $BACKEND_PID) - logs in logs/backend.log"
echo "  2. Frontend Server (PID: $FRONTEND_PID) - logs in logs/frontend.log"
echo "  3. Browser (Dashboard)"
echo ""
echo "Dashboard: http://localhost:3000"
echo "Backend:   http://localhost:8000"
echo ""
echo "ACTION: Break the laser beam to see data!"
echo "  - Check logs/backend.log for backend status"
echo "  - Check logs/frontend.log for frontend status"
echo ""
echo "To stop: Run 'pkill -f uvicorn' and 'pkill -f npm'"
echo ""

# Keep the script running to maintain the background processes
wait
