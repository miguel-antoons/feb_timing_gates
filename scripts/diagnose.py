#!/usr/bin/env python3
"""
Complete FEB Timing System Diagnostics
Checks all serial ports and captures data
"""

import serial
import time
import sys

def test_port(port_name, description, duration_seconds=10):
    """Test a serial port and capture data"""
    print(f"\n{'='*60}")
    print(f"Testing: {description}")
    print(f"Port: {port_name}")
    print(f"Duration: {duration_seconds} seconds")
    print(f"{'='*60}")
    
    try:
        ser = serial.Serial(port_name, 115200, timeout=1)
        print(f"✓ Port {port_name} opened successfully\n")
        
        start_time = time.time()
        data_found = False
        line_count = 0
        
        while time.time() - start_time < duration_seconds:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line:
                    print(f"[{line_count}] {line}")
                    data_found = True
                    line_count += 1
            time.sleep(0.1)
        
        ser.close()
        
        if data_found:
            print(f"\n✅ SUCCESS: Received {line_count} lines of data")
            return True
        else:
            print(f"\n⚠️  No data received (may still be working)")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

print("\n" + "="*60)
print("FEB TIMING SYSTEM - COMPLETE DIAGNOSTICS")
print("="*60)

# Test Backend Connection
print("\n[1/2] Testing Backend on Port 8000...")
try:
    import requests
    response = requests.get("http://localhost:8000", timeout=2)
    print("✓ Backend is responding")
except Exception as e:
    print(f"⚠️  Backend not responding: {e}")

# Test Hub (COM8)
test_port("COM8", "Hub Receiver (COM8)")

# Test Laser Gate (COM7)  
test_port("COM7", "Laser Gate (COM7)")

print("\n" + "="*60)
print("DIAGNOSTICS COMPLETE")
print("="*60)
print("\nInterpretation:")
print("  ✅ COM8 has data    → Hub receiving from laser gate ✓")
print("  ❌ COM8 no data     → Laser gate not sending (wireless issue)")
print("  ✅ COM7 has data    → Laser gate detecting breaks ✓")
print("  ❌ COM7 no data     → Laser not aligned with receiver")
print("\n")

# Recommendations
print("NEXT STEPS:")
print("1. Block laser beam while this runs")
print("2. Check which ports show data")
print("3. If COM8 shows data: alignment working, frontend issue")
print("4. If COM8 no data, COM7 no data: wireless pairing issue")
print("5. If COM7 shows data but COM8 doesn't: MAC address mismatch")
print("\n")
