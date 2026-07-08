#!/usr/bin/env python3
"""
Compile and upload ESP32 gate firmware using Arduino CLI
"""

import subprocess
import sys
import os

# Paths
PROJECT_ROOT = r"c:\Users\medved01\OneDrive - TMC\1\FEB timing\FEB-Timing"
SKETCH = os.path.join(PROJECT_ROOT, "electronics", "sender_sketch_gate_1.ino")
ARDUINO_CLI = r"C:\Users\medved01\AppData\Local\ArduinoCLI\arduino-cli.exe"
FQBN = "esp32:esp32:esp32c3"  # Fully Qualified Board Name for ESP32-C3
PORT = "COM7"

def run_command(cmd, description):
    """Run a command and report status"""
    print(f"\n{'='*60}")
    print(f">>> {description}")
    print(f"{'='*60}")
    print(f"Command: {' '.join(cmd)}\n")
    
    result = subprocess.run(cmd, capture_output=False, text=True)
    
    if result.returncode != 0:
        print(f"\n✗ FAILED: {description}")
        return False
    else:
        print(f"\n✓ SUCCESS: {description}")
        return True

# Step 1: Compile
compile_cmd = [
    ARDUINO_CLI,
    "compile",
    "--fqbn", FQBN,
    SKETCH
]

if not run_command(compile_cmd, "Compiling gate firmware"):
    sys.exit(1)

# Step 2: Upload
upload_cmd = [
    ARDUINO_CLI,
    "upload",
    "--fqbn", FQBN,
    "--port", PORT,
    SKETCH
]

if not run_command(upload_cmd, "Uploading to laser gate on COM7"):
    sys.exit(1)

print(f"\n{'='*60}")
print("✓ DONE! Laser gate firmware uploaded to COM7")
print(f"{'='*60}\n")
