# Troubleshooting

## Common Issues and Solutions

### Timing Gates Not Connecting

**Symptoms:**
- Timing gates not appearing in the Sender List
- No events being recorded

**Possible Causes and Solutions:**

1. **Incorrect receiver MAC address in sender firmware**
   - Verify the receiver's MAC address
   - Update the sender firmware with the correct MAC
   - Re-flash all timing gates

2. **WiFi range issues**
   - Move timing gates closer to the receiver
   - Ensure there are no large obstacles between devices
   - Check for interference from other WiFi networks

3. **Power issues**
   - Verify all timing gates have sufficient power
   - Check battery levels or power connections

4. **ESP-NOW initialization failure**
   - Check serial output for error messages
   - Re-flash the firmware
   - Try a different ESP32 board

### GPS Synchronization Issues

**Symptoms:**
- Inconsistent or incorrect timestamps
- Events not being recorded

**Possible Causes and Solutions:**

1. **GPS module not receiving signal**
   - Ensure the GPS antenna has a clear view of the sky
   - Wait for the GPS module to acquire a lock (can take several minutes)
   - Check GPS module connections

2. **Incorrect wiring**
   - Verify GPS TX → ESP32 RX connection
   - Verify GPS RX → ESP32 TX connection
   - Verify GPS PPS → ESP32 PPS pin connection

3. **Baud rate mismatch**
   - Ensure the GPS module is configured for 115200 baud
   - Check the sender firmware for correct baud rate settings

### Application Connection Issues

**Symptoms:**
- Application not connecting to receiver
- No events appearing in the Events Pane
- Serial port not listed in the application

**Possible Causes and Solutions:**

1. **Serial port not accessible**
   - Ensure no other program is using the serial port
   - Try disconnecting and reconnecting the USB cable
   - Try a different USB port or cable
   - Restart the Tauri application

2. **Incorrect baud rate**
   - Verify the baud rate is set to 115200 in both firmware and application
   - Check the serial monitor in Arduino IDE to confirm communication

3. **Permission issues**
   - On Linux, ensure your user is in the `dialout` group:
     ```bash
     sudo usermod -a -G dialout $USER
     ```
   - Then log out and log back in for the changes to take effect
   - On Windows, ensure you have the proper drivers installed for the ESP32 board

4. **Tauri backend issues**
   - Check the application logs for errors
   - Try running the application in development mode to see more detailed logs:
     ```bash
     npm run tauri dev
     ```
   - Ensure Rust and all dependencies are properly installed

5. **Port not listed**
   - Make sure the receiver is properly connected
   - Try a different USB cable (some cables are power-only)
   - Check if the device appears in your system's device manager/list of serial devices

### Event Duplication or Missing Events

**Symptoms:**
- Duplicate events in the dashboard
- Events not appearing in the correct order
- Missing events

**Possible Causes and Solutions:**

1. **Network congestion**
   - Reduce the number of timing gates
   - Increase the distance between timing gates
   - Check for WiFi interference

2. **Incorrect event handling**
   - Verify the event counter is incrementing correctly
   - Check the sender firmware for proper event handling

3. **Time synchronization issues**
   - Verify GPS synchronization on all timing gates
   - Check GPS signal strength

## Error Codes

### ESP32 Error Codes

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 3 | ADD_PEER_FAILURE | Failed to add peer to ESP-NOW | Check MAC address format, reset device |
| 5 | IDENTIFY_REQUEST_FAILURE | Identify request failed | Verify device is powered on and in range |
| 6 | INVALID_MAC_FORMAT | Invalid MAC address format | Use format AA:BB:CC:DD:EE:FF or AABBCCDDEEFF |
| 7 | RCVD_SIZE_MISMATCH | Received data size mismatch | Check firmware versions, reset devices |
| 11 | ESP_NOW_INIT_FAILURE | ESP-NOW initialization failed | Reset device, check WiFi antenna |
| 13 | UNKNOWN_MESSAGE_TYPE | Unknown message type received | Update firmware, check for corruption |
| 14 | WRONG_MESSAGE_FORMAT | Incorrect message format | Verify the message format matches the expected CSV structure |

### Tauri Application Errors

| Error | Description | Solution |
|-------|-------------|----------|
| Failed to open port | The application couldn't open the selected serial port | Check if another program is using the port, verify permissions, try a different cable/port |
| Failed to write to port | The application couldn't write data to the serial port | Check if the port is still connected, verify the device is responsive |
| Failed to list ports | The application couldn't list available serial ports | Check system permissions, ensure proper drivers are installed |

## Debugging Tools

### Serial Monitor

Use the Arduino IDE's serial monitor to view debug output from both senders and receiver:

1. Open the Arduino IDE
2. Select the correct port
3. Set the baud rate to 115200
4. Open the serial monitor

### Simulation Tools

The `src/esp32/tools` directory contains simulation tools:

- `simulate_sender.ino` - Simulates a timing gate
- `simulate_receiver.ino` - Simulates a receiver
- `mac_address_loop.ino` - Displays the device's MAC address

Use these tools to test communication without physical hardware.