#!/usr/bin/env python3
"""Quick test to see what's on each COM port"""

import serial
import time
import sys

ports = ['COM3', 'COM4', 'COM7']

print("\n" + "="*60)
print("SERIAL PORT TEST - Checking what devices are connected")
print("="*60 + "\n")

for port in ports:
    print(f"Testing {port}...")
    try:
        s = serial.Serial(port, 115200, timeout=1)
        time.sleep(0.5)
        
        # Read available data
        output = ""
        for _ in range(10):
            if s.in_waiting > 0:
                output += s.read(1).decode('utf-8', errors='ignore')
            time.sleep(0.1)
        
        s.close()
        
        if output:
            # Show first 100 chars
            preview = output[:100].replace('\n', ' ').replace('\r', ' ')
            print(f"  ✓ DATA FOUND: {preview}...\n")
        else:
            print(f"  - No data (may still be working)\n")
            
    except Exception as e:
        print(f"  ✗ Error: {e}\n")

print("="*60)
print("COM7 = Laser Gate (confirmed earlier)")
print("COM3 or COM4 = Hub Receiver")
print("="*60 + "\n")
