#!/bin/bash
# FEB Timing System - Quick Start (Linux/macOS)
# Run this script to start everything
# Press Ctrl+C to stop all started processes

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Track child PIDs for cleanup
declare -a CHILD_PIDS=()

# Cleanup function - kill all started processes
cleanup() {
    echo ""
    echo "======================================="
    echo "  FEB TIMING SYSTEM - SHUTTING DOWN..."
    echo "======================================="
    
    # Kill all tracked child processes
    for pid in "${CHILD_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "Killing process $pid..."
            kill -TERM "$pid" 2>/dev/null
        fi
    done
    
    # Wait for processes to exit gracefully
    for pid in "${CHILD_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            wait "$pid" 2>/dev/null
        fi
    done
    
    # Force kill any remaining processes
    pkill -f "uvicorn" 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null
    
    echo "All processes stopped."
    exit 0
}

# Trap Ctrl+C (SIGINT) and SIGTERM for cleanup
trap cleanup SIGINT SIGTERM

clear

echo "======================================="
echo "  FEB TIMING SYSTEM - STARTING..."
echo "======================================="
echo ""

# Kill any existing processes (optional)
echo "Killing existing processes..."
pkill -f "uvicorn" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 1

# Create a temporary directory for logs
mkdir -p "$PROJECT_ROOT/logs"

# Function to check if a port is available
check_port() {
    local port=$1
    if command -v netstat &> /dev/null; then
        netstat -tlnp 2>/dev/null | grep -q ":$port "
    elif command -v ss &> /dev/null; then
        ss -tlnp 2>/dev/null | grep -q ":$port "
    elif command -v lsof &> /dev/null; then
        lsof -i :$port &> /dev/null
    else
        return 1
    fi
    return $?
}

# Function to wait for backend to start
wait_for_backend() {
    local max_attempts=30
    local attempt=0
    
    echo "Waiting for backend to start (port 8000)..."
    
    while [ $attempt -lt $max_attempts ]; do
        if check_port 8000; then
            echo "Backend is running on port 8000"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "ERROR: Backend failed to start on port 8000"
    return 1
}

# Function to wait for frontend to start
wait_for_frontend() {
    local max_attempts=30
    local attempt=0
    
    echo "Waiting for frontend to start (port 3000)..."
    
    while [ $attempt -lt $max_attempts ]; do
        if check_port 3000; then
            echo "Frontend is running on port 3000"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "ERROR: Frontend failed to start on port 3000"
    return 1
}

# Start Backend
echo "Starting Backend Server (Port 8000)..."
cd "$PROJECT_ROOT/src/backend" || {
    echo "ERROR: Failed to change to backend directory"
    exit 1
}

uv run uvicorn receiver:app --host 0.0.0.0 --port 8000 > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
CHILD_PIDS+=("$BACKEND_PID")
echo "Backend started (PID: $BACKEND_PID)"
echo "  Logs: $PROJECT_ROOT/logs/backend.log"

# Wait for backend to initialize
sleep 2

# Verify backend started
if ! wait_for_backend; then
    echo ""
    echo "======================================="
    echo "  BACKEND STARTUP FAILED"
    echo "======================================="
    echo ""
    echo "Check logs for errors:"
    echo "  tail -f $PROJECT_ROOT/logs/backend.log"
    echo ""
    echo "Common issues:"
    echo "  - Python not installed"
    echo "  - uv not installed (run: curl -LsSf https://astral.sh/uv/install.sh | sh)"
    echo "  - Port 8000 already in use"
    echo ""
    cleanup
    exit 1
fi

echo ""

# Start Frontend
echo "Starting Frontend Server (Port 3000)..."
cd "$PROJECT_ROOT/src/frontend" || {
    echo "ERROR: Failed to change to frontend directory"
    cleanup
    exit 1
}

npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
CHILD_PIDS+=("$FRONTEND_PID")
echo "Frontend started (PID: $FRONTEND_PID)"
echo "  Logs: $PROJECT_ROOT/logs/frontend.log"

# Wait for frontend to start
sleep 3

# Verify frontend started
if ! wait_for_frontend; then
    echo ""
    echo "======================================="
    echo "  FRONTEND STARTUP FAILED"
    echo "======================================="
    echo ""
    echo "Check logs for errors:"
    echo "  tail -f $PROJECT_ROOT/logs/frontend.log"
    echo ""
    echo "Common issues:"
    echo "  - Node.js not installed"
    echo "  - npm not found"
    echo "  - Missing dependencies (run: npm install)"
    echo "  - Port 3000 already in use"
    echo ""
    cleanup
    exit 1
fi

echo ""

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
echo "======================================="
echo "  ✓ SYSTEM STARTED SUCCESSFULLY"
echo "======================================="
echo ""
echo "Processes:"
echo "  Backend (PID: $BACKEND_PID) - http://localhost:8000"
echo "  Frontend (PID: $FRONTEND_PID) - http://localhost:3000"
echo ""
echo "Logs:"
echo "  Backend: tail -f $PROJECT_ROOT/logs/backend.log"
echo "  Frontend: tail -f $PROJECT_ROOT/logs/frontend.log"
echo ""
echo "ACTION: Break the laser beam to see data!"
echo ""
echo "Press Ctrl+C to stop all processes"
echo ""

# Monitor child processes and wait for Ctrl+C
while true; do
    # Check if any child process is still running
    any_running=false
    for pid in "${CHILD_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            any_running=true
            break
        fi
    done
    
    # If no processes are running, exit
    if [ "$any_running" = false ]; then
        echo "All processes have exited."
        exit 0
    fi
    
    # Sleep briefly
    sleep 2
done
