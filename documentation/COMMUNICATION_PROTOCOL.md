# Communication Protocol

## Overview

The FEB Timing Gates system uses multiple communication protocols:

1. **ESP-NOW** - Wireless communication between timing gates and receiver
2. **Serial (UART)** - Communication between receiver and computer
3. **Web Serial API** - Browser-based communication with the receiver

## Message Structure

All messages use a common structure:

```cpp
typedef struct struct_message {
    uint8_t message_type;      // Type of message
    uint32_t timestamp_s;      // Unix Epoch Seconds
    uint32_t timestamp_us;     // Microseconds since last second (0-999999)
    uint32_t event;            // Event counter
    uint8_t mac_address[6];    // Sender's MAC address
} struct_message;
```

## Message Types

| Type | Value | Description | Direction |
|------|-------|-------------|-----------|
| BEAM_EVENT | 1 | Laser beam break event | Sender → Receiver |
| IDENTIFY_SENDER_REQUEST | 2 | Request to identify a sender | Receiver → Sender |
| ADD_PEER_FAILURE | 3 | Failed to add peer | Receiver → Computer |
| IDENTIFY_REQUEST_SUCCESS | 4 | Identify request succeeded | Receiver → Computer |
| IDENTIFY_REQUEST_FAILURE | 5 | Identify request failed | Receiver → Computer |
| INVALID_MAC_FORMAT | 6 | Invalid MAC address format | Receiver → Computer |
| RCVD_SIZE_MISMATCH | 7 | Received data size mismatch | Both directions |
| ESP_READY | 8 | ESP-NOW initialized | Receiver → Computer |
| LOCAL_MAC | 9 | Local MAC address | Receiver → Computer |
| ESP_HELLO | 10 | Serial connection established | Receiver → Computer |
| ESP_NOW_INIT_FAILURE | 11 | ESP-NOW initialization failed | Receiver → Computer |
| IDENTIFY_RECEIVER_REQUEST | 12 | Request receiver's MAC address | Computer → Receiver |
| UNKNOWN_MESSAGE_TYPE | 13 | Unknown message type | Receiver → Computer |
| WRONG_MESSAGE_FORMAT | 14 | Incorrect message format | Receiver → Computer |

## Serial Communication Format

Messages sent via serial use a CSV format:

```
[message_type],[timestamp_s],[timestamp_us],[event],[MAC_ADDRESS]
```

Example:
```
1,1708081234,123456,1,AA:BB:CC:DD:EE:FF
```

## ESP-NOW Communication

- **Timing Gates (Senders)**: Broadcast beam break events to the receiver
- **Receiver**: Can send identification requests to specific timing gates

## Web Serial API

The frontend uses the Web Serial API to communicate with the receiver:

1. **Connect**: User selects a serial port to connect to
2. **Read**: The frontend continuously reads data from the serial port
3. **Write**: The frontend can send commands to the receiver:
   - `12` - Request the receiver's MAC address
   - `2,[MAC_ADDRESS]` - Request identification of a specific sender

## Time Synchronization

- Timing gates use GPS with PPS (Pulse Per Second) for precise time synchronization
- The GPS module provides UTC time and a precise 1Hz signal
- Each timing gate maintains its own synchronized clock based on GPS time