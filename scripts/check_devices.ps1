# Quick serial port scanner to identify devices

function Test-ComPort {
    param([string]$Port)
    
    try {
        $ser = New-Object System.IO.Ports.SerialPort($Port)
        $ser.BaudRate = 115200
        $ser.Open()
        Start-Sleep -Milliseconds 500
        
        Write-Host "[$Port] - Opened successfully"
        
        # Try to read any available data
        if ($ser.BytesToRead -gt 0) {
            $data = $ser.ReadExisting()
            Write-Host "[$Port] Data received: $data" -ForegroundColor Green
        } else {
            Write-Host "[$Port] No data yet (waiting...)"
        }
        
        Start-Sleep -Milliseconds 2000
        
        if ($ser.BytesToRead -gt 0) {
            $data = $ser.ReadExisting()
            Write-Host "[$Port] Second read: $data" -ForegroundColor Cyan
        }
        
        $ser.Close()
    }
    catch {
        Write-Host "[$Port] Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Testing all COM ports ===" -ForegroundColor Yellow
Write-Host "Make sure both devices are plugged in and powered on`n"

foreach ($port in @("COM3", "COM4", "COM5", "COM7")) {
    Write-Host "`nTesting $port..." -ForegroundColor Cyan
    Test-ComPort -Port $port
    Start-Sleep -Milliseconds 500
}

Write-Host "`n=== Done ===" -ForegroundColor Yellow
