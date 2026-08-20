# Hardware Setup

## Components

The FEB Timing Gates system requires the following hardware components:

1. **Timing Gates (Senders)**
  - **XIAO ESP32C6 microcontrollers** - WiFi/Bluetooth enabled microcontrollers for wireless communication
  - **BANNER QS18VN6LP Laser sensors** - Detect beam breaks when a vehicle passes through a timing gate
  - **Grove Air530Z GPS modules** - Provide precise timing synchronization for all devices
  - **LM2596 DC-DC Step Down Power Supply** - Regulate voltage for the timing gates
  - **Dewalt Battery Adapters** - Provide portable power to the timing gates

2. **Receiver Hub**
   - **XIAO ESP32C6 microcontrollers** - WiFi/Bluetooth enabled microcontrollers for wireless communication
   - **USB-C cable** - For connecting the receiver to a computer for serial communication

## Physical Setup

### Timing Gate Assembly

[[Image: Timing Gate Assembly](project_schema.pdf)]

### Receiver Hub Setup

1. Connect the ESP32 to a computer via USB for serial communication

## Power Considerations

- Each timing gate should be powered by a stable power source (battery or power adapter)
- Ensure all devices are within WiFi range of the receiver hub
- GPS modules require a clear view of the sky for optimal performance