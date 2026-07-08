# FEB Timing System - Hardware Setup Checklist

This checklist will help verify everything is connected and working correctly before starting the system.

---

## ✅ Pre-Startup Checks

### Devices Connected
- [ ] Laser Gate (COM7) plugged into PC via USB
- [ ] Hub Receiver (COM8) plugged into PC via USB
- [ ] Both devices powered on (LEDs blinking)
- [ ] USB cables are good quality (not damaged)

### COM Ports Verified
```powershell
# Run in PowerShell to verify
[System.IO.Ports.SerialPort]::GetPortNames()
```
- [ ] COM7 listed (Laser Gate)
- [ ] COM8 listed (Hub Receiver)
- [ ] If missing, check Device Manager and restart device

### Software Prerequisites
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Project dependencies installed (npm install, pip install -r requirements.txt)

---

## 🚀 Startup Verification

### Step 1: Run Start Script
```
📁 Double-click: start_all.bat
```
- [ ] Two terminal windows opened
- [ ] Backend terminal shows: `Uvicorn running on http://0.0.0.0:8000`
- [ ] Frontend terminal shows: `VITE ready in XXXX ms` and `Local: http://localhost:3000`
- [ ] Dashboard opened in browser at http://localhost:3000

### Step 2: Check Backend Connection
Look at backend terminal for these messages:
```
2026-06-10 XX:XX:XX [INFO] Connected to COM8
2026-06-10 XX:XX:XX [INFO] Client connected. Total clients: 1
```
- [ ] Both messages appear within 5 seconds of startup
- [ ] Backend is ready to receive data

### Step 3: Test API (Software Test)
```powershell
# In PowerShell, run this:
$body = @{ raw_line = "1,1708081230,123456,1,101" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/simulate" -Method Post -ContentType "application/json" -Body $body
```
- [ ] Command returns: `status: processed raw line`
- [ ] Backend terminal shows: `New Event: gate_id=1...`
- [ ] This confirms software pipeline works

---

## 🔌 Hardware Alignment (CRITICAL)

### Physical Setup
1. Place laser gate and hub close together (0.5 - 1 meter for testing)
2. Secure both devices so they don't move
3. Aim laser beam directly at receiver diode on hub
   - Receiver is small "lightbulb" looking component
   - Laser beam should hit it directly

### Alignment Test
- [ ] Laser beam visible as red line hitting the diode
- [ ] You can block beam with your hand
- [ ] When beam blocked, try running this test:

```powershell
# Terminal 1: Start monitoring laser gate
python "read_laser.py"

# Terminal 2: While monitoring, block laser beam with your hand
# You should see output in Terminal 1 if working
```
- [ ] Output appears when beam is blocked
- [ ] Output stops when beam is clear

---

## 🧪 Full System Test

### Pre-Test
- [ ] All startup checks passed
- [ ] Hardware aligned properly
- [ ] Backend and frontend running
- [ ] Laser gate monitor terminal open

### Test Procedure
1. Start monitoring:
   ```powershell
   python "read_laser.py"
   ```

2. Block laser beam with opaque object (hand, cardboard)

3. Check for output in terminal

### Expected Results
- ✅ **Working**: Terminal shows Arduino messages when beam is blocked
- ✅ **Working**: Messages appear immediately when blocking
- ✅ **Working**: Messages stop when releasing beam
- ❌ **Not Working**: No output appears at all

---

## 🚨 If Tests Fail

### No Backend Connection to COM8
**Error**: `Connection failed... retrying`
- [ ] Verify COM8 in Device Manager
- [ ] Try different USB port
- [ ] Restart Hub device
- [ ] Update COM port in `python/receiver.py` if different

### Hardware Not Detecting Laser Breaks
**Issue**: Monitor shows no output when blocking beam
- [ ] **Laser alignment** - Reposition laser to hit diode center
- [ ] **Distance** - Test within 0.5 meter first
- [ ] **Stability** - Secure both devices firmly
- [ ] **Obstruction** - Use fully opaque object
- [ ] **USB cable** - Verify hub USB cable is good quality

### Dashboard Not Loading
**Issue**: http://localhost:3000 shows error
- [ ] Check frontend terminal for errors
- [ ] Kill and restart frontend: `npm run dev`
- [ ] Try different browser (Chrome, Edge, Firefox)

### Port Already in Use
**Error**: `Address already in use`
- [ ] Close other applications
- [ ] Or kill Python: `Get-Process python | Stop-Process -Force`

---

## 📊 System Status Dashboard

Check this table to verify all systems are working:

| Component | Expected | Check |
|-----------|----------|-------|
| Backend Port | 8000 | http://localhost:8000 responds |
| Frontend Port | 3000 | http://localhost:3000 loads |
| COM7 Status | Connected | Show in Device Manager |
| COM8 Status | Connected | Show in Device Manager |
| Serial Data | CSV format | `gate_id,gps_s,gps_us,beam,event` |
| Simulation | Works | API test returns data |
| Hardware | Aligned | Laser hits receiver diode |
| Detection | Triggers | Monitor shows output |

---

## 🔄 Typical Operating Sequence

**Morning Setup:**
```
1. Plug in USB cables (COM7, COM8)
2. Double-click start_all.bat
3. Wait for dashboard to load (30 seconds)
4. Test simulation API
5. Align laser gates at track
6. Test beam detection
7. Ready for racing
```

**During Race:**
```
1. Monitor dashboard in real-time
2. All lap times auto-broadcast
3. Check terminal for any errors
4. Keep devices stable (no vibration)
```

**Shutting Down:**
```
1. Close both terminal windows
2. Close browser
3. Unplug USB devices
4. Done
```

---

## 📞 Emergency Contacts

**System Won't Start:**
1. Restart computer
2. Reconnect USB cables
3. Run `start_all.bat` again

**No Data Appearing:**
1. Check laser/receiver alignment
2. Verify both COM ports detected
3. Check backend logs for errors

**Still Not Working:**
1. Check `COMPLETE_SETUP_GUIDE.md` for full troubleshooting
2. Check `QUICK_REFERENCE.md` for common issues
3. Review hardware alignment (most common issue)

---

## ✨ Success Indicators

✅ **System is working correctly if:**
- Backend shows: `"Connected to COM8"`
- Frontend loads at http://localhost:3000
- Simulation API test returns data
- Monitor shows output when laser beam is blocked
- Data appears on dashboard in real-time

🎉 **Ready to race when all above are green!**

---

## 📝 Notes Section

Use this space to record any setup details:

```
Setup Date: _______________
COM7 Status: _______________
COM8 Status: _______________
Laser Distance: _______________
Receiver Alignment: _______________
Any Issues: _______________
```

---

Good luck! This system is ready for your race timing needs. 🏁
