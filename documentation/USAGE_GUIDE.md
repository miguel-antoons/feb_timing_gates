# Usage Guide

## Starting the System

1. **Power on all timing gates** - Ensure each gate has power and the laser beam is properly aligned
2. **Connect the receiver hub** - Plug the receiver ESP32 into your computer via USB
3. **Start the Tauri application**:
   - For development: Run `npm run tauri dev` in the frontend directory
   - For production: Run the built executable from `src-tauri/target/release`
4. **Connect to the receiver** - Click the "Connect" button in the dashboard and choose the correct serial port for the receiver

Once a sender has a GPS lock, it should automatically connect to the receiver. The sender will appear in the dashboard when it successfully sends its first beam break event to the receiver. If it doesn't appear:

1. Check the PPS light on the timing gate - it should be blinking once per second when GPS is locked
2. Break the laser beam to trigger an event
3. If it still doesn't appear, check the serial monitor of the sender for errors
4. Verify that the receiver's MAC address in the sender firmware matches your actual receiver's MAC address

### Tauri Application

The Tauri application provides a native desktop experience with direct access to system resources. The interface consists of two main panes:

### Sender List (Left Pane)
- Lists all detected timing gates
- Shows the MAC address and alias for each gate
- Allows setting the distance between gates
- Provides connection status and controls

### Events Pane (Right Pane)
- Displays timing events in chronological order
- Shows session ID, timestamp, time difference, and speed
- Provides controls for:
  - Creating a new session
  - Resetting all data
  - Manually triggering an event

## Operating Modes

### Normal Operation
1. When a vehicle breaks a laser beam, the timing gate records the event
2. The event is sent wirelessly to the receiver hub
3. The receiver forwards the event to the computer via serial
4. The frontend dashboard displays the event in real-time
5. Speed is calculated based on the time difference between gates and the distance between them

### Device Identification

To identify a specific timing gate:

1. Click the "Identify" button next to a sender in the Sender List
2. The corresponding timing gate will blink its LED for 5 seconds
3. Use this to verify which physical gate corresponds to which entry in the dashboard

## Session Management

- **New Session**: Creates a new timing session, incrementing the session ID
- **Reset All**: Clears all timing data and resets the session ID to 1
- **Manual Trigger**: Manually records an event (useful for testing or manual timing)