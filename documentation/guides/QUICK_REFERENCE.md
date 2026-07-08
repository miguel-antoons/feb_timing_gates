# FEB Timing System - Quick Reference & Troubleshooting

## 🚀 Quick Start (Choose One)

### Windows Options

#### Option 1: Double-Click (Easiest)
```
📁 Double-click: scripts/start_all.bat
   Opens backend and frontend in separate windows + dashboard
```

#### Option 2: PowerShell (Advanced)
```powershell
& "./scripts/start_all.ps1"
```

### Linux/macOS Option

#### Option 3: Shell Script
```bash
chmod +x scripts/start_all.sh
./scripts/start_all.sh
```

### Manual (Full Control - All Platforms)

#### Terminal 1 - Backend (Using uv - Recommended)
```bash
cd src/backend
uv run uvicorn receiver:app --port 8000
```

#### Terminal 1 - Backend (Using pip)
```bash
uvicorn src.backend.receiver:app --port 8000
```

#### Terminal 2 - Frontend
```bash
cd src/frontend
npm run dev
```

---

## 🎯 Common Tasks

### Test Without Hardware
```powershell
# Simulate lap trigger
$body = @{ raw_line = "1,1708081230,123456,1,101" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/simulate" -Method Post -ContentType "application/json" -Body $body
```

### Check Hardware Connection

**Windows (PowerShell):**
```powershell
# List COM ports
[System.IO.Ports.SerialPort]::GetPortNames()

# Monitor laser gate
python scripts/read_laser.py

# Monitor hub
python scripts/read_hub.py
```

**Linux/macOS:**
```bash
# List serial ports
ls /dev/tty*

# Or use dmesg after plugging in
sudo dmesg | grep tty

# Monitor laser gate
python3 scripts/read_laser.py

# Monitor hub
python3 scripts/read_hub.py
```

### Change COM Port (If Different)
Edit `src/backend/receiver.py` line 25:
```python
SERIAL_PORT = os.getenv("SERIAL_PORT", "COM8")  # Change to your port
```

**Examples:**
- Windows: `COM3`, `COM4`, `COM7`, `COM8`
- Linux: `/dev/ttyUSB0`, `/dev/ttyACM0`
- macOS: `/dev/cu.usbserial-XXXX`, `/dev/cu.usbmodemXXXX`

---

## 🔧 Troubleshooting

### ❌ "Connection to COM port failed"
**Problem**: Backend can't find the Hub on COM8

**Solutions:**
1. **Check actual port:**
   - Windows: Check Device Manager
   - Linux/macOS: Run `ls /dev/tty*`
2. Verify Hub is plugged in with good USB cable
3. Update COM port in `src/backend/receiver.py`
4. Try unplugging and replugging Hub
5. **Linux-specific:** Ensure user has permission to access serial port:
   ```bash
   sudo usermod -a -G dialout $USER
   # Log out and back in for changes to take effect
   ```

---

### ❌ "Port 8000 already in use"
**Problem**: Backend won't start because port is occupied

**Solutions:**
1. Close other applications using port 8000
2. **Windows:** Change port:
   ```powershell
   cd src\backend; uv run uvicorn receiver:app --port 8001
   ```
   Or kill existing Python:
   ```powershell
   Get-Process python | Stop-Process -Force
   ```
3. **Linux/macOS:** Change port:
   ```bash
   cd src/backend; uv run uvicorn receiver:app --port 8001
   ```
   Or find and kill process:
   ```bash
   lsof -i :8000  # Find process ID
   kill -9 <PID>
   # Or
   pkill -f uvicorn
   ```

---

### ❌ "Dashboard shows no data"
**Problem**: Frontend won't show timing events

**Checklist:**
- [ ] Backend shows `"Connected to [PORT]"` in logs (port varies by platform)
- [ ] Frontend loaded without errors
- [ ] Try simulation API test first
- [ ] Check browser console (F12) for errors
- [ ] Verify backend is on http://localhost:8000

**Test backend manually:**
```bash
# Check if backend is running
curl http://localhost:8000

# Test simulation API
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"raw_line": "1,1708081230,123456,1,101"}'
```

---

### ❌ "Laser isn't detecting beam breaks"
**Problem**: Breaking laser beam doesn't trigger data

**Physical Alignment (CRITICAL):**
1. **Point laser directly at receiver diode on hub**
   - Receiver is small "lightbulb" component on hub
   - Laser beam must hit it directly
2. **Keep both devices completely still**
   - Any vibration affects detection
   - Secure with clamps or stand
3. **Test close together first**
   - Start within 0.5 meter
   - Extend distance gradually
4. **Use opaque object to block beam**
   - Hand, cardboard, or paper
   - Not transparent materials

**Debug:**

**Windows:**
```powershell
# Monitor COM7 for sensor output
python scripts/read_laser.py
# While monitoring, slowly block laser beam
# Should see data in terminal if working
```

**Linux/macOS:**
```bash
# Monitor for sensor output (adjust port as needed)
python3 scripts/read_laser.py
# While monitoring, slowly block laser beam
# Should see data in terminal if working
```

**Tip:** If you get permission errors on Linux/macOS, try:
```bash
# Temporarily run as root to test
sudo python3 scripts/read_laser.py
# If this works, fix permissions:
sudo usermod -a -G dialout $USER
```

---

### ❌ "Permission denied" error
**Problem**: Can't access serial ports

**Solutions:**
1. Run PowerShell as Administrator
2. Or reinstall USB driver for devices

---

### ❌ Board Manager stuck "Downloading Index"
**Problem**: Arduino IDE Board Manager hangs

**Solutions:**
1. Wait 10+ minutes (normal for large downloads)
2. Or restart Arduino IDE
3. Check internet connection speed

---

## 📊 System Architecture

```
COM7 (Laser Gate)          COM8 (Hub)              Your PC
     ESP32                    ESP32              
   - Laser emitter ─────> ESP-NOW ─────> USB ─> COM8
   - Detects breaks              Serial output
     at 115200 baud              115200 baud
                                        ↓
                          Python Backend (8000)
                          - WebSocket broadcast
                                        ↓
                          React Dashboard (3000)
                          - Real-time display
```

---

## 📋 Important Numbers to Remember

| Item | Value |
|------|-------|
| Backend Port | 8000 |
| Frontend Port | 3000 |
| Laser Gate COM | COM7 |
| Hub COM | COM8 |
| Baud Rate | 115200 |
| Backend URL | http://localhost:8000 |
| Dashboard URL | http://localhost:3000 |
| WebSocket | ws://localhost:8000/ws/timing |
| API Simulate | POST http://localhost:8000/api/simulate |

---

## 🎮 Testing Workflow

**Step 1: Start System**
```
Double-click scripts/start_all.bat
```

**Step 2: Verify Dashboard**
- Opens at http://localhost:3000
- Check for connection status

**Step 3: Test Simulation**
```powershell
# Simulate a lap
$body = @{ raw_line = "1,1708081230,123456,1,101" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/simulate" -Method Post -ContentType "application/json" -Body $body
```

**Step 4: Check Backend Logs**
- Should show: `New Event: gate_id=1...`
- Should show: `Broadcasting...`

**Step 5: Test Hardware (If Aligned)**
- Point laser at hub receiver
- Block beam with your hand
- Check if terminal output appears

---

## 🔄 Typical Workflow for Race

1. **Setup Morning**
   - Mount laser gates at start/finish and trap speed zones
   - Align laser → receiver (use paper at distance to verify)
   - Verify COM ports are detected
   
2. **Start System**
   - Double-click `scripts/start_all.bat`
   - Wait for dashboard to load
   
3. **Test Run**
   - Have test car/object cross gates
   - Verify lap times appear on dashboard
   
4. **Race Mode**
   - Monitor dashboard in real-time
   - All lap times auto-broadcast
   - Data persists in backend

---

## 💡 Pro Tips

1. **Laser alignment matters MOST**
   - Spend 10 minutes getting it perfect
   - Test alignment with paper target

2. **Keep devices powered and stable**
   - Use USB power bank for hub
   - Mount gates with vibration damping

3. **Distance affects detection**
   - Shorter distances = better reliability
   - Longer distances need better alignment

4. **Simulate first**
   - Always test API before relying on hardware
   - Confirms software is working

5. **Monitor terminals**
   - Keep backend terminal visible
   - Shows all events and errors in real-time

---

## 📞 Quick Support

**Backend won't start?**
→ Check COM port in src/backend/receiver.py

**Frontend won't load?**
→ Check if npm run dev succeeded in src/frontend

**No data from gates?**
→ Check laser/receiver alignment first

**Port already in use?**
→ Close other apps or use different port

---

## 📁 Important Files

- `scripts/start_all.bat` - Easy startup (double-click)
- `scripts/start_all.ps1` - Advanced startup (PowerShell)
- [Complete Setup Guide](../guides/COMPLETE_SETUP_GUIDE.md) - Full documentation
- `src/backend/receiver.py` - Backend code (adjust COM port here)
- `src/frontend/App.tsx` - Frontend code

---

## ✅ Checklist Before Race

- [ ] Both devices (COM7, COM8) detected in Device Manager
- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Simulation API test works
- [ ] Laser and receiver aligned and stable
- [ ] Test lap detected correctly
- [ ] Dashboard shows data in real-time

Good luck with your race! 🏁
