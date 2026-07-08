# FEB Timing System - Complete Setup & Running Guide

## ✅ Project Status

**Hardware Setup:**
- ✅ Hub Receiver on **COM8** @ 115200 baud (ESP32 with receiver diode)
- ✅ Laser Gate on **COM7** @ 115200 baud (ESP32 with laser emitter)
- ✅ Both devices have firmware installed
- ⚠️ **Important**: Laser and receiver diode alignment is critical for detection

**Software:**
- ✅ Python backend (FastAPI + WebSocket) on port 8000
- ✅ React frontend (Vite) on port 3000
- ✅ All dependencies installed

---

## 🚀 Quick Start (One Command)

**Run this:**
```powershell
& "c:\Users\medved01\OneDrive - TMC\1\FEB timing\FEB-Timing\start_all.ps1"
```

This will automatically:
1. Start Python backend (port 8000)
2. Start React frontend (port 3000) 
3. Open dashboard in browser
4. Show status in terminals

---

## 📋 Manual Setup (If Preferred)

### Prerequisites
- Python 3.10+ (already installed)
- Node.js 18+ (already installed)
- Dependencies already installed

### Step 1: Start Backend Server

**Terminal 1:**
```powershell
cd "c:\Users\medved01\OneDrive - TMC\1\FEB timing\FEB-Timing"
python -m uvicorn python.receiver:app --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
2026-06-10 XX:XX:XX [INFO] Attempting to connect to COM8...
2026-06-10 XX:XX:XX [INFO] Connected to COM8
```

### Step 2: Start Frontend Server

**Terminal 2:**
```powershell
cd "c:\Users\medved01\OneDrive - TMC\1\FEB timing\FEB-Timing"
npm run dev
```

**Expected output:**
```
VITE v6.4.1 ready in 1603 ms
➜  Local:   http://localhost:3000/
```

### Step 3: Open Dashboard

Open browser to: **http://localhost:3000**

---

## 🔌 Hardware Configuration

### Ports
- **COM7**: Laser Gate Sensor (emitter)
- **COM8**: Hub Receiver (collects wireless data, outputs to PC)

### Changing COM Ports

If your ports are different, edit `python/receiver.py`:

```python
# Line 23
SERIAL_PORT = os.getenv("SERIAL_PORT", "COM8")  # Change COM8 to your port
```

Or set environment variable before running:
```powershell
$env:SERIAL_PORT="COM3"
python -m uvicorn python.receiver:app --port 8000
```

---

## 🧪 Testing

### Option 1: Simulate Lap Events (No Hardware)

**Test Gate 1 (Start/Finish):**
```powershell
$body = @{ raw_line = "1,1708081230,123456,1,101" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/simulate" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**Test Gate 2 (Trap Speed):**
```powershell
$body = @{ raw_line = "2,1708081250,500000,1,201" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/simulate" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**Important**: Change the last number (event_id) each time to avoid duplicate filtering:
- 101 → 102 → 103 (for successive laps)
- 201 → 202 → 203 (for successive trap speeds)

### Option 2: Real Hardware Testing

**Laser Alignment is Critical:**
1. Position laser gate and hub close together (within 1 meter for testing)
2. **Point laser beam directly at receiver diode on hub**
3. Keep both completely still (any vibration affects detection)
4. Block the laser beam with your hand
5. Check if terminal output appears on COM7

**Monitor COM7:**
```powershell
python "c:\Users\medved01\OneDrive - TMC\1\FEB timing\FEB-Timing\read_laser.py"
```

---

## 📊 Data Flow

```
┌─────────────────────────┐
│  Laser Gate (COM7)      │
│  - Emits laser beam     │
│  - Detects beam breaks  │
│  - Sends via ESP-NOW    │
└──────────┬──────────────┘
           │ Wireless (ESP-NOW)
           │
┌──────────▼──────────────┐
│  Hub Receiver (COM8)    │
│  - Receives wireless    │
│  - Outputs CSV serial   │
└──────────┬──────────────┘
           │ Serial (USB)
           │
┌──────────▼──────────────┐
│  Python Backend         │
│  - Port 8000            │
│  - WebSocket broadcast  │
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│  React Dashboard        │
│  - Port 3000            │
│  - Real-time display    │
└─────────────────────────┘
```

---

## 🔧 Configuration Files

### `python/receiver.py`
- Main backend server
- Reads from COM8 at 115200 baud
- Broadcasts via WebSocket on port 8000
- Filters duplicate events by (gate_id, event_id)

### `vite.config.ts`
- React frontend build config
- Dev server on port 3000

### Serial Event Format (CSV)
```
gate_id,gps_s,gps_us,beam_broken,event_id
1,1708081230,123456,1,101
```

- `gate_id`: 1 (Start/Finish) or 2 (Trap Speed)
- `gps_s`: Unix timestamp (seconds)
- `gps_us`: Microseconds
- `beam_broken`: 1 (beam broken) or 0 (clear)
- `event_id`: Unique ID (increments each event)

---

## 🛠️ Troubleshooting

### Backend won't connect to COM port
```
Error: Connection failed... retrying
```
**Solutions:**
- Check Device Manager for correct COM port
- Verify USB cable is properly connected
- Update `SERIAL_PORT` in `python/receiver.py`
- Restart the device

### Dashboard shows no data
1. Check backend logs for `"Connected to COM8"`
2. Try simulation API test first
3. Verify frontend can reach backend: http://localhost:8000

### Laser isn't detecting beam breaks
1. **Alignment**: Point laser directly at receiver diode on hub
2. **Distance**: Test within 1 meter first
3. **Stability**: Secure both devices so they don't move
4. **Obstruction**: Use opaque object (hand, cardboard) to block beam
5. **Monitor COM7**: Run `read_laser.py` to see if terminal outputs data

### Port already in use
```
Error: Address already in use
```
**Solutions:**
- Kill existing processes: `Get-Process python | Stop-Process`
- Change port: `uvicorn python.receiver:app --port 8001`

---

## 📁 Project Structure

```
FEB-Timing/
├── App.tsx                 # Main React app
├── index.html             # HTML entry point
├── package.json           # Node dependencies
├── python/
│   ├── receiver.py        # Backend server
│   └── requirements.txt    # Python dependencies
├── components/            # React components
├── electronics/           # Arduino sketches
│   ├── sender_sketch_gate_1.ino
│   ├── sender_sketch_gate_2.ino
│   └── receiver_sketch.ino
├── sketches/              # Renamed sketches for Arduino IDE
└── README.md              # This file
```

---

## 🔄 Firmware Upload (If Needed)

If firmware needs updating, use Arduino IDE 2.3.10:

**Gate (COM7):**
1. File → Open → `sketches/sender_gate_1/sender_gate_1.ino`
2. Tools → Board → `ESP32C3 Dev Module`
3. Tools → Port → `COM7`
4. Upload (Ctrl+U)

**Hub (COM8):**
1. File → Open → `sketches/receiver_hub/receiver_hub.ino`
2. Tools → Board → `ESP32C3 Dev Module`
3. Tools → Port → `COM8`
4. Upload (Ctrl+U)

---

## 📞 Support Info

**System Specs:**
- Python: 3.12
- Node.js: 18+
- React: 19.2.3
- FastAPI: 0.129.0
- Vite: 6.2.0

**API Endpoints:**
- WebSocket: `ws://localhost:8000/ws/timing`
- Simulate: `POST http://localhost:8000/api/simulate`

---

## ✅ Checklist Before Going Live

- [ ] Both devices (COM7, COM8) plugged in and powered
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Dashboard accessible at http://localhost:3000
- [ ] Laser and receiver diode aligned and stable
- [ ] Test lap simulation working
- [ ] Test physical beam break detection

---

## 🎯 Next Steps

1. **Align hardware properly** - laser beam must hit receiver diode
2. **Test simulations** to verify data flow
3. **Test physical detection** with aligned laser/receiver
4. **Set up race track** installation
5. **Calibrate distances** between gates for accurate trap speed calculation

Good luck! 🚀
