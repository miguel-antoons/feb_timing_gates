# FEB Timing System - User Guide

A real-time timing system for racing events, powered by Arduino hardware and a modern React dashboard.

## Overview

This system consists of two parts:

1. **Python Backend (`src/backend/receiver.py`)**: Reads serial data from an Arduino (or simulated triggers), filters duplicates, and broadcasts events via WebSocket.
2. **React Frontend (`src/frontend/`)**: Connects to the backend via WebSocket to display live lap times, sector splits, and trap speeds.

---

## 1. Installation & Setup

### Prerequisites
- **Python 3.10+** (Recommend 3.11 or 3.12)
- **Node.js 18+** (LTS recommended)

### Backend Setup (Python)

#### Using uv (Recommended)

The project uses [uv](https://github.com/astral-sh/uv) for Python dependency management.

**Install uv (if not already installed):**

```bash
# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex
```

**Install dependencies:**
```bash
cd src/backend
uv sync
```

#### Using pip (Alternative)

If you prefer traditional pip:
```bash
pip install -r src/backend/requirements.txt
```

### Frontend Setup (React)
1. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```
2. Install node modules:
   ```bash
   npm install
   ```

---

## 2. Running the System

You need two terminal windows running simultaneously.

### Quick Start (All Platforms)

**Windows:** Double-click `scripts/start_all.bat`

**Linux/macOS:** Run `scripts/start_all.sh`

**PowerShell:** Run `scripts/start_all.ps1`

### Manual Start (Individual Components)

#### Terminal 1: Start the Backend Server

This server listens for Arduino data on your configured COM port (default varies by platform) and hosts the WebSocket API.

**Using uv (Recommended):**
```bash
# From project root
cd src/backend
uv run uvicorn receiver:app --host 0.0.0.0 --port 8000 --reload
```

**Using pip:**
```bash
# From project root
uvicorn src.backend.receiver:app --host 0.0.0.0 --port 8000 --reload
```

- The server will start on `http://localhost:8000`.
- If no Arduino is connected, you will see harmless "Connection failed... retrying" logs.

#### Terminal 2: Start the Frontend Dashboard

```bash
# From project root
cd src/frontend
npm run dev
```

- Open your browser to `http://localhost:3000`.
- Check the browser console (F12) to confirm: `Connected to Timing Server`.

---

## 3. Simulating Triggers (Manual Testing)

If you don't have the hardware connected, you can simulate gate triggers using the API. The system treats these exactly like real hardware events.

**IMPORTANT: The system filters duplicate events.**
To trigger a *new* lap or speed trap, you must change the **`event_id`** (the last number in the CSV string) for each request.

### API Endpoint

`POST http://localhost:8000/api/simulate`

### Example Scenarios

#### 1. Trigger Gate 1 (Start / Finish Lap)

Use `gate_id = 1`. Increment the last number (`101` -> `102` -> `103`...) for each new lap.

**Bash / Mac / Linux:**
```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d "{\"raw_line\": \"1,1708081230,123456,1,101\"}"
```

**Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/simulate" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"raw_line": "1,1708081230,123456,1,101"}'
```

#### 2. Trigger Gate 2 (Trap Speed)

Use `gate_id = 2`. This calculates speed based on time since the last Gate 1 trigger.

**Bash / Mac / Linux:**
```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d "{\"raw_line\": \"2,1708081250,500000,1,201\"}"
```

**Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/simulate" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"raw_line": "2,1708081250,500000,1,201"}'
```

### Data Format Explained

The simulator expects a raw CSV string simulating the Arduino output:

`gate_id, gps_s, gps_us, beam_state, event_id`

- `gate_id`: `1` (Start/Finish) or `2` (Trap Speed).
- `gps_s`: Unix timestamp (seconds).
- `gps_us`: Microseconds.
- `beam_state`: `1` (Broken) or `0`.
- `event_id`: **Unique ID** (increment this manually for simulation).

---

## 4. Configuration

### Changing COM Port

If your Arduino is on a different port, set it via environment variable before running the backend:

**Windows (PowerShell):**
```powershell
$env:SERIAL_PORT="COM3"; cd src\backend; uv run uvicorn receiver:app --port 8000
```

**Linux/Mac:**
```bash
SERIAL_PORT=/dev/ttyUSB0 uv run uvicorn receiver:app --port 8000
```

**Note:** Default ports by platform:
- **Windows:** Typically `COM3`, `COM4`, `COM7`, `COM8`
- **Linux/macOS:** Typically `/dev/ttyUSB0`, `/dev/ttyACM0`

### Finding Your Serial Port

**Windows (PowerShell):**
```powershell
[System.IO.Ports.SerialPort]::GetPortNames()
```

**Linux/macOS:**
```bash
# List all serial devices
ls /dev/tty*

# Or use dmesg after plugging in the device
sudo dmesg | grep tty
```

---

## Additional Resources

For more detailed information, please refer to:

- [Project Summary](../guides/PROJECT_SUMMARY.md) - System overview
- [Complete Setup Guide](../guides/COMPLETE_SETUP_GUIDE.md) - Full technical details
- [Hardware Setup Checklist](../guides/HARDWARE_SETUP_CHECKLIST.md) - Verification steps
- [Quick Reference](../guides/QUICK_REFERENCE.md) - Common tasks and troubleshooting

---

**For quick startup:** Use `scripts/start_all.bat` to start everything automatically.
