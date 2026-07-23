#include <WiFi.h>

// Fixed MAC address for simulation (format: XX:XX:XX:XX:XX:XX)
const uint8_t SIMULATED_MAC[6] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF};

// Serial output configuration
const unsigned long SERIAL_BAUD = 115200;
const unsigned long SEND_INTERVAL_MS = 10000;  // 3 seconds

#define BEAM_EVENT 1
#define IDENTIFY_SENDER_REQUEST 2
#define ADD_PEER_FAILURE 3
#define IDENTIFY_REQUEST_SUCCESS 4
#define IDENTIFY_REQUEST_FAILURE 5
#define INVALID_MAC_FORMAT 6
#define RCVD_SIZE_MISMATCH 7
#define ESP_READY 8
#define LOCAL_MAC 9
#define ESP_HELLO 10
#define ESP_NOW_INIT_FAILURE 11
#define IDENTIFY_RECEIVER_REQUEST 12
#define UNKNOWN_MESSAGE_TYPE 13
#define WRONG_MESSAGE_FORMAT 14

// Simulation state
unsigned long lastSendTime = 0;

// Function to output beam event data to serial
void outputData(
    uint8_t message_type,
    uint32_t timestamp_s,
    uint32_t timestamp_us,
    uint32_t event,
    const uint8_t *mac_address
) {
    // [timestamp_s],[timestamp_us],[event],[MAC_ADDRESS]
    Serial.print(message_type);
    Serial.print(",");
    Serial.print(timestamp_s);
    Serial.print(",");
    Serial.print(timestamp_us);
    Serial.print(",");
    Serial.print(event);
    Serial.print(",");
    // Print MAC address as hex values
    for (int i = 0; i < 6; i++) {
        Serial.printf("%02X", mac_address[i]);
        if (i < 5) Serial.print(":");
    }
    Serial.println();
}

void outputMsgCode(uint8_t code) {
    uint8_t localMac[6];
    WiFi.macAddress(localMac);
    return outputData(code, 0, 0, 0, localMac);
}


void setup() {
    // Initialize serial
    Serial.begin(SERIAL_BAUD);
    while (!Serial) {
        delay(10);
    }
    outputMsgCode(ESP_HELLO);
    
    outputMsgCode(ESP_READY);
}

void sendLocalMacAddress() {
    uint8_t localMac[6];
    WiFi.macAddress(localMac);
    outputData(LOCAL_MAC, 0, 0, 0, localMac);
}

void loop() {
    unsigned long currentTime = millis();
    
    // Check if it's time to send a simulated message
    if (currentTime - lastSendTime >= SEND_INTERVAL_MS) {
        lastSendTime = currentTime;
        // Generate random data for simulation
        uint32_t timestamp_s = random(1700000000, 1800000000);  // Random timestamp in 2023-2024
        uint32_t timestamp_us = random(0, 999999);              // Random microseconds (0-999999)
        uint32_t event = random(1, 100);                         // Random event ID (1-99)
        outputData(BEAM_EVENT, timestamp_s, timestamp_us, event, SIMULATED_MAC);
    }

    if (Serial.available() > 0) {
        String input = Serial.readStringUntil('\n');
        input.trim();
        
        if (input.length() > 0) {
            // Check if input is comma-separated
            int commaPos = input.indexOf(',');
            
            if (commaPos != -1) {
                // Parse message type and MAC address (if present)
                uint8_t messageType = input.substring(0, commaPos).toInt();
                String macStr = input.substring(commaPos + 1);

                switch (messageType) {
                    case IDENTIFY_RECEIVER_REQUEST:
                        sendLocalMacAddress();
                        break;
                    default:
                        outputMsgCode(UNKNOWN_MESSAGE_TYPE);
                        return;
                }
            } else {
                outputMsgCode(WRONG_MESSAGE_FORMAT);
            }
        }
    }
    
    // Small delay to reduce CPU usage
    delay(10);
}