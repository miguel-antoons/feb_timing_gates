import serial
import time

ser = serial.Serial('COM8', 115200, timeout=2)
time.sleep(1)

print("\n=== Reading Hub's Serial Output ===\n")

for i in range(50):
    if ser.in_waiting > 0:
        data = ser.readline().decode('utf-8', errors='ignore').strip()
        print(data)
    time.sleep(0.1)

ser.close()
print("\nDone!")
