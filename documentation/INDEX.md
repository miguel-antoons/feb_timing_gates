# 📖 FEB Timing System - Documentation Index

Welcome! Your FEB Timing System is **fully configured and ready to use**. This file helps you find what you need.

---

## 🚀 **START HERE** (Pick One)

### If you want to run the system NOW:

**Windows:**
```
📁 Double-click: scripts/start_all.bat
```

**Windows (PowerShell):**
```powershell
./scripts/start_all.ps1
```

**Linux/macOS:**
```bash
chmod +x scripts/start_all.sh
./scripts/start_all.sh
```

This starts everything automatically in separate terminals + opens the dashboard.

### If you want to understand the system first:
📄 Read: [Project Summary](guides/PROJECT_SUMMARY.md) (5-minute overview)

### If you need to troubleshoot something:
📄 Read: [Quick Reference](guides/QUICK_REFERENCE.md) (search for your problem)

---

## 📚 All Documentation Files

| File | Purpose | Read Time | Who Should Read |
|------|---------|-----------|-----------------|
| **scripts/start_all.bat** | Windows one-click startup | N/A | Windows users |
| **scripts/start_all.ps1** | Windows PowerShell startup | N/A | Windows users |
| **scripts/start_all.sh** | Linux/macOS startup | N/A | Linux/macOS users |
| **[Project Summary](guides/PROJECT_SUMMARY.md)** | System overview & status | 5 min | Project lead |
| **[Quick Reference](guides/QUICK_REFERENCE.md)** | Common tasks & fixes | 5-10 min | Daily operators |
| **[Complete Setup Guide](guides/COMPLETE_SETUP_GUIDE.md)** | Full technical details | 15-20 min | Developers |
| **[Hardware Setup Checklist](guides/HARDWARE_SETUP_CHECKLIST.md)** | Verification steps | 10 min | Setup technician |
| **[User Guide](guides/USER_GUIDE.md)** | Installation & usage | 10 min | All users |

---

## 🎯 Quick Links by Use Case

### "I just want to run the system"
1. Double-click `start_all.bat`
2. Dashboard opens automatically
3. System is running

### "I want to test before using real hardware"
1. Open `scripts/start_all.bat`
2. Follow simulation examples in [Quick Reference](guides/QUICK_REFERENCE.md)
3. See events on dashboard

### "I need to align the laser gates"
1. Read: [Hardware Setup Checklist](guides/HARDWARE_SETUP_CHECKLIST.md) → "Hardware Alignment"
2. Monitor: `python "scripts/read_laser.py"`
3. Test blocking the beam

### "Something isn't working"
1. Check: [Quick Reference](guides/QUICK_REFERENCE.md) → "Troubleshooting"
2. Try the solution listed
3. If still broken, read: [Complete Setup Guide](guides/COMPLETE_SETUP_GUIDE.md)

### "I'm setting this up for the first time"
1. Read: [Hardware Setup Checklist](guides/HARDWARE_SETUP_CHECKLIST.md)
2. Follow each step carefully
3. Use [Quick Reference](guides/QUICK_REFERENCE.md) if stuck

### "I need technical details"
1. Read: [Complete Setup Guide](guides/COMPLETE_SETUP_GUIDE.md)
2. Check: `src/backend/receiver.py` (backend code)
3. Check: `src/frontend/App.tsx` (frontend code)

---

## 🔧 System Architecture

```
Your Laptop
│
├─ Terminal 1: Python Backend (port 8000)
│  └─ Reads from COM8 (Hub) at 115200 baud
│
├─ Terminal 2: React Frontend (port 3000)
│  └─ Displays dashboard
│
└─ Browser: http://localhost:3000
   └─ Shows real-time timing data

Connected Devices:
├─ COM7: Laser Gate (emits laser, detects breaks)
└─ COM8: Hub Receiver (collects wireless data, outputs serial)
```

---

## ⚡ Quick Commands

### Run Everything
```bash
start_all.bat
```

### Test Simulation
```powershell
$body = @{ raw_line = "1,1708081230,123456,1,101" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/simulate" -Method Post -ContentType "application/json" -Body $body
```

### Monitor Laser Gate
```bash
python "scripts/read_laser.py"
```

### List COM Ports
```powershell
[System.IO.Ports.SerialPort]::GetPortNames()
```

---

## 🛑 Common Issues & Solutions

| Problem | Quick Fix | Read More |
|---------|-----------|-----------|
| System won't start | Run `start_all.bat` again | QUICK_REFERENCE.md |
| No data on dashboard | Check backend logs | QUICK_REFERENCE.md |
| Laser not detecting | Align laser → receiver | HARDWARE_SETUP_CHECKLIST.md |
| COM port error | Verify device plugged in | QUICK_REFERENCE.md |
| Port already in use | Use different port | QUICK_REFERENCE.md |

---

## 📋 Files Organization

```
FEB-Timing/
├─ documentation/
│  ├─ INDEX.md (this file)
│  └─ guides/
│     ├─ PROJECT_SUMMARY.md
│     ├─ COMPLETE_SETUP_GUIDE.md
│     ├─ QUICK_REFERENCE.md
│     ├─ HARDWARE_SETUP_CHECKLIST.md
│     └─ USER_GUIDE.md
│
├─ scripts/
│  ├─ start_all.bat (👈 Run this!)
│  ├─ start_all.ps1
│  ├─ read_laser.py
│  ├─ read_hub.py
│  └─ quick_test.py
│
├─ src/
│  ├─ backend/ (Backend)
│  │  ├─ receiver.py
│  │  └─ requirements.txt
│  ├─ frontend/ (React Frontend)
│  │  ├─ App.tsx
│  │  ├─ vite.config.ts
│  │  ├─ tsconfig.json
│  │  └─ components/ (React components)
│  └─ esp32/ (Arduino sketches)
│     ├─ electronics/
│     └─ sketches/
│
└─ README.md
```

---

## 🎓 Learning Path

**If you're new to this system, follow this order:**

1. **Quick Overview** (2 min)
   - Read: [Project Summary](guides/PROJECT_SUMMARY.md)
   
2. **Run the System** (1 min)
   - Double-click: `scripts/start_all.bat`
   
3. **Test Software** (5 min)
   - Follow: [Quick Reference](guides/QUICK_REFERENCE.md) → "Test Without Hardware"
   
4. **Set Up Hardware** (15 min)
   - Read: [Hardware Setup Checklist](guides/HARDWARE_SETUP_CHECKLIST.md)
   - Follow each step
   
5. **Test Hardware** (10 min)
   - Align laser gates
   - Monitor COM7 with `python "scripts/read_laser.py"`
   - Test beam detection
   
6. **Deploy** (Depends on your setup)
   - Mount gates at track
   - Run system during race
   - Monitor dashboard

---

## ✅ Verification Checklist

Use this quick checklist before each use:

- [ ] COM7 and COM8 detected in Device Manager
- [ ] `start_all.bat` runs without errors
- [ ] Backend shows "Connected to COM8"
- [ ] Frontend loads at http://localhost:3000
- [ ] Simulation API test works
- [ ] Laser and receiver aligned
- [ ] Ready to go!

---

## 📞 Help

### Can't find what you need?
1. Check `QUICK_REFERENCE.md` first (fastest)
2. Then `COMPLETE_SETUP_GUIDE.md` (detailed)
3. Finally `HARDWARE_SETUP_CHECKLIST.md` (verification)

### Getting an error?
1. Note the exact error message
2. Search for it in [Quick Reference](guides/QUICK_REFERENCE.md)
3. Follow the solution steps

### Still stuck?
1. Check all terminal output
2. Read "Troubleshooting" sections in guides
3. Review this INDEX file

---

## 🎯 Common Goals

### "I want to run the race timing system"
→ Double-click `scripts/start_all.bat` (done!)

### "I want to test it works"
→ Read [Quick Reference](guides/QUICK_REFERENCE.md) → "Test Without Hardware"

### "I want to understand how it works"
→ Read [Complete Setup Guide](guides/COMPLETE_SETUP_GUIDE.md)

### "I want to fix something"
→ Read [Quick Reference](guides/QUICK_REFERENCE.md) → "Troubleshooting"

### "I want to set it up for the first time"
→ Read [Hardware Setup Checklist](guides/HARDWARE_SETUP_CHECKLIST.md) completely

---

## 🚀 Status

✅ **System Fully Configured**
- Backend ready on port 8000
- Frontend ready on port 3000
- Devices connected on COM7 & COM8
- Documentation complete
- Ready for production use

---

**Next Step:** Double-click `start_all.bat` and enjoy your timing system! 🏁

---

*Last Updated: June 10, 2026*  
*Version: 1.0 Complete*
