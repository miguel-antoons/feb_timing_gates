# Usage Guide

## Starting the System

1. **Power on all timing gates** - Ensure each gate has power and the laser beam is properly aligned
2. **Connect the receiver hub** - Plug the receiver ESP32 into your computer via USB
3. **Start the frontend dashboard** - Run `npm run dev` in the frontend directory
4. **Connect to the receiver** - Click the "Connect" button in the dashboard and choose the correct serial port for the receiver

Once a sender has a GPS lock, it should automatically connect to the receiver. If it doesn't appear in the dashboard, check the PPS light on the timing gate. If it's not blinking, the gate hasn't connected to the receiver yet. If it is blinking, try to break the laser beam to see if the sender gets added to the dashboard. If it still doesn't appear, check the serial monitor of the sender for any errors.

## Frontend Dashboard

The dashboard consists of two main panes:

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
2. The corresponding timing gate will blink its LED for 3 seconds
3. Use this to verify which physical gate corresponds to which entry in the dashboard

## Session Management

- **New Session**: Creates a new timing session, incrementing the session ID
- **Reset All**: Clears all timing data and resets the session ID to 1
- **Manual Trigger**: Manually records an event (useful for testing or manual timing)