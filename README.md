# FEB Timing System

A real-time timing system for racing events, powered by Arduino hardware and a modern React dashboard.

## Overview

This system provides complete race timing capabilities with:
- **Hardware**: ESP32-based wireless laser timing gates + hub receiver
- **Backend**: Python FastAPI server with WebSocket broadcasting (uses **uv** for dependency management)
- **Frontend**: React dashboard displaying live lap times, sector splits, and trap speeds

---

## Project Structure

```
FEB-Timing/
├── src/
│   ├─ backend/          # Python backend (FastAPI + WebSocket + uv)
│   │   ├─ receiver.py         # Main server
│   │   ├─ pyproject.toml     # uv dependencies
│   │   └─ requirements.txt    # Legacy pip backup
│   ├─ frontend/         # React dashboard (Vite)
│   │   ├─ App.tsx            # Main React app
│   │   └─ components/       # React components
│   └─ esp32/            # Arduino sketches
├── scripts/            # Utility and startup scripts
│   ├─ start_all.bat    # Windows (double-click)
│   ├─ start_all.ps1    # Windows (PowerShell)
│   └─ start_all.sh     # Linux/macOS
└── documentation/      # Complete documentation
   ├─ INDEX.md          # Documentation index
   └─ guides/           # All guides
      ├─ USER_GUIDE.md          # User guide and basic usage
      ├─ PROJECT_SUMMARY.md     # System overview
      ├─ QUICK_REFERENCE.md      # Common tasks & troubleshooting
      ├─ COMPLETE_SETUP_GUIDE.md # Full technical details
      └─ HARDWARE_SETUP_CHECKLIST.md # Hardware verification
```

---

## Quick Start

### Windows
- **Double-click:** `scripts/start_all.bat`
- **PowerShell:** Run `./scripts/start_all.ps1`

### Linux/macOS
- **Terminal:** 
  ```bash
  chmod +x scripts/start_all.sh  # If not already executable
  ./scripts/start_all.sh
  ```

The system will:
1. Start Python backend on port 8000 (using uv)
2. Start React frontend on port 3000
3. Open dashboard in your browser at `http://localhost:3000`

---

## Installation

### Prerequisites
- **Python 3.10+** (Recommend 3.11+)
- **Node.js 18+** (LTS recommended)

### Backend (Python)

**Install uv (if not already installed):**
```bash
# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex
```

**Install Python dependencies:**
```bash
cd src/backend
uv sync
```

### Frontend (React)
```bash
cd src/frontend
npm install
```

---

## Documentation

Complete documentation is available in the `documentation/` folder:

- **[Documentation Index](documentation/INDEX.md)** - Start here for all documentation
- **[User Guide](documentation/guides/USER_GUIDE.md)** - Installation, setup, and usage
- **[Quick Reference](documentation/guides/QUICK_REFERENCE.md)** - Common tasks and troubleshooting
- **[Project Summary](documentation/guides/PROJECT_SUMMARY.md)** - System overview and architecture
- **[Complete Setup Guide](documentation/guides/COMPLETE_SETUP_GUIDE.md)** - Full technical documentation
- **[Hardware Setup Checklist](documentation/guides/HARDWARE_SETUP_CHECKLIST.md)** - Hardware verification steps

---

## Platform Support

| Platform | Startup Script | Backend Command | Dependency Management |
|----------|---------------|-----------------|----------------------|
| **Windows** | `scripts/start_all.bat` | `uv run uvicorn receiver:app` | uv (pyproject.toml) |
| **Windows** | `scripts/start_all.ps1` | `uv run uvicorn receiver:app` | uv (pyproject.toml) |
| **Linux/macOS** | `scripts/start_all.sh` | `uv run uvicorn receiver:app` | uv (pyproject.toml) |

---

## Support

For troubleshooting and detailed information, refer to the [Documentation Index](documentation/INDEX.md).

**Need uv?** Install from https://astral.sh/uv

**Need help?** Check the [Quick Reference](documentation/guides/QUICK_REFERENCE.md) for platform-specific troubleshooting.

Good luck with your timing system! 🏁
