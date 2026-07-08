import serial
import time

print("\n=== Checking Laser Gate (COM7) ===")
print("Break the laser beam while this is running...\n")

ser = serial.Serial('COM7', 115200, timeout=2)
time.sleep(1)

for i in range(50):
    if ser.in_waiting > 0:
        data = ser.readline().decode('utf-8', errors='ignore').strip()
        if data:
            print(f"[{i}] {data}")
    time.sleep(0.1)

ser.close()
print("\nDone!")
