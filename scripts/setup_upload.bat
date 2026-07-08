@echo off
echo Installing esptool.py for ESP32 flashing...
python -m pip install esptool -q

echo.
echo Checking connected boards...
echo COM7 = Laser Gate Sensor
echo COM3 or COM4 = Hub Receiver

echo.
echo Done! Ready to upload sketches.
