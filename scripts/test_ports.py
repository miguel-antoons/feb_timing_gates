import serial
import time

def monitor_port(port_name):
    try:
        ser = serial.Serial(port_name, 115200, timeout=2)
        print(f"\n=== Monitoring {port_name} ===")
        print("Waiting for data (5 seconds)...")
        
        start = time.time()
        data_found = False
        
        while time.time() - start < 5:
            if ser.in_waiting:
                data = ser.readline().decode('utf-8', errors='ignore').strip()
                if data:
                    print(f"✓ Data: {data[:80]}")
                    data_found = True
        
        if not data_found:
            print("- No data received")
            
        ser.close()
    except Exception as e:
        print(f"✗ Error on {port_name}: {str(e)[:50]}")

print("\n" + "="*50)
print("TESTING SERIAL CONNECTIONS")
print("="*50)

for port in ['COM3', 'COM4', 'COM7']:
    monitor_port(port)

print("\n" + "="*50)
