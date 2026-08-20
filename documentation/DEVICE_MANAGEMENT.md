# Device Management

## Adding New Devices

### Adding a New Timing Gate (Sender)

1. **Flash the sender firmware** to the new ESP32 device
2. **Update the receiver MAC address** in the sender code if needed:
   ```cpp
   uint8_t receiverAddress[] = {0x10, 0xBD, 0xA3, 0x9E, 0x5D, 0x3C};  // Replace with your receiver's MAC
   ```
3. **Power on the timing gate** - It will automatically connect to the receiver once it has got a gps lock
4. **Verify connection** - The gate should appear in the Sender List in the dashboard. If it doesn't, check the pps light on the timing gate. If it's not blinking, the gate hasn't connected to the receiver yet. If it is blinking, try to break the laser beam to see if the sender gets added to the dashboard. If it still doesn't appear, check the serial monitor for any errors.

## Changing Devices

### Replacing the Receiver

1. **Note the MAC address** of the new receiver:
   - Flash the receiver firmware to the new device
   - Connect to it via serial and send the `IDENTIFY_RECEIVER_REQUEST` command
   - The receiver will respond with its MAC address

2. **Update all timing gates** with the new receiver MAC address:
   ```cpp
   uint8_t receiverAddress[] = {0xNEW, 0xMAC, 0xADDR, 0xESS, 0xHERE};
   ```

3. **Re-flash all timing gates** with the updated firmware

### Replacing a Timing Gate

1. **Flash the sender firmware** to the new ESP32 device
2. **Update the receiver MAC address** in the new device's code
3. **Power on the new timing gate** - It will appear as a new device in the dashboard
4. **Update the alias** in the dashboard to match the replaced gate

## MAC Address Management

### Finding a Device's MAC Address

#### For the Receiver:
There are two methods to find the receiver's MAC address:

**Method 1: Using the IDENTIFY_RECEIVER_REQUEST command**
1. Connect to the receiver via serial
2. Send the command: `12` (IDENTIFY_RECEIVER_REQUEST)
3. The receiver will respond with its MAC address in the format: `9,0,0,0,AA:BB:CC:DD:EE:FF`

**Method 2: Using the mac_address_loop.ino tool**
1. Flash the `mac_address_loop.ino` tool to the receiver device
2. Open the serial monitor at 115200 baud
3. The device will continuously print its MAC address in two formats:
   - Colon-separated: `AA:BB:CC:DD:EE:FF`
   - C array format: `uint8_t mac[] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF};`

#### For a Timing Gate:
1. In the dashboard, click the "Identify" button next to a sender
2. The timing gate will blink its LED for 3 seconds
3. The MAC address is displayed in the Sender List

### Formatting MAC Addresses

MAC addresses can be formatted in two ways:

1. **Colon-separated**: `AA:BB:CC:DD:EE:FF`
2. **Continuous**: `AABBCCDDEEFF`

Both formats are accepted by the system.