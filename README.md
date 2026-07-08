# FEB Timing System

A real-time timing system for racing events, powered by Arduino hardware and a modern React dashboard.

## Overview
This system consists of two parts:
1.  **Python Backend (`receiver.py`)**: Reads serial data from an Arduino (or simulated triggers), filters duplicates, and broadcasts events via WebSocket.
2.  **React Frontend**: Connects to the backend via WebSocket to display live lap times, sector splits, and trap speeds.

## 1. Installation & Setup

### prerequisites
*   **Python 3.10+** (Recommend 3.11)
*   **Node.js 18+**

### Backend Setup (Python)
1.  Navigate to the project root.
2.  Install python dependencies:
    ```bash
    pip install -r python/requirements.txt
    ```

### Frontend Setup (React)
1.  Install node modules:
    ```bash
    npm install
    ```

---

## 2. Running the System

You need two terminal windows running simultaneously.

### Terminal 1: Start the Backend Server
This server listens for Arduino data on `COM4` (by default) and hosts the WebSocket API.

```bash
# From project root
uvicorn python.receiver:app --port 8000 --reload
```
*   The server will start on `http://localhost:8000`.
*   If no Arduino is connected, you will see harmless "Connection failed... retrying" logs.

### Terminal 2: Start the Frontend Dashboard
```bash
# From project root
npm run dev
```
*   Open your browser to `http://localhost:3000`.
*   Check the browser console (F12) to confirm: `Connected to Timing Server`.

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

*   `gate_id`: `1` (Start/Finish) or `2` (Trap Speed).
*   `gps_s`: Unix timestamp (seconds).
*   `gps_us`: Microseconds.
*   `beam_state`: `1` (Broken) or `0`.
*   `event_id`: **Unique ID** (increment this manually for simulation).

---

## 4. Configuration

### Changing COM Port
If your Arduino is on a different port (e.g., `COM3` or `/dev/ttyUSB0`), set it via environment variable before running uvicorn:

**Windows (PowerShell):**
```powershell
$env:SERIAL_PORT="COM3"; uvicorn python.receiver:app --port 8000
```

**Linux/Mac:**
```bash
SERIAL_PORT=/dev/ttyUSB0 uvicorn python.receiver:app --port 8000
```
