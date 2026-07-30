#include <esp_now.h>
#include <WiFi.h>

// Serial output configuration
const unsigned long SERIAL_BAUD = 115200;

// Error LED configuration
const int ERROR_LED_PIN = 2;

// Message types
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

// ESP-NOW message structure (must match sender)
typedef struct struct_message {
    uint8_t message_type;
    uint32_t timestamp_s;     // Unix Epoch Seconds
    uint32_t timestamp_us;    // Microseconds since last second (0-999999)
    uint32_t event;
    uint8_t mac_address[6];  // Sender's MAC address for identification
} struct_message;

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

// For sending identify requests
struct_message identifyMsg;
esp_now_peer_info_t peerInfo;

// Callback when data is received via ESP-NOW
void OnDataRecv(const esp_now_recv_info_t *recv_info, const uint8_t *receivedData, int len) {
    if (len != sizeof(struct_message)) {
        outputMsgCode(RCVD_SIZE_MISMATCH);
        return;
    }
    
    // Copy received data to local struct
    struct_message msg;
    memcpy(&msg, receivedData, sizeof(struct_message));
    
    // Only process beam events (ignore identify requests)
    if (msg.message_type == BEAM_EVENT) {
        // Output beam event data
        outputData(msg.message_type, msg.timestamp_s, msg.timestamp_us, msg.event, msg.mac_address);
        
        // Blink LED briefly to indicate reception
        digitalWrite(ERROR_LED_PIN, LOW);
        delay(10);
        digitalWrite(ERROR_LED_PIN, HIGH);
    }
}

// Function to parse MAC address from string (format: "XX:XX:XX:XX:XX:XX" or "XXXXXXXXXX")
bool parseMacAddress(const String &macStr, uint8_t *macAddr) {
    // Try colon-separated format first
    if (macStr.length() == 17) {
        for (int i = 0; i < 6; i++) {
            String byteStr = macStr.substring(i * 3, i * 3 + 2);
            char *end;
            long byte = strtol(byteStr.c_str(), &end, 16);
            if (*end != 0 && i < 5) return false;
            macAddr[i] = (uint8_t)byte;
        }
        return true;
    }
    // Try continuous format (12 hex chars)
    else if (macStr.length() == 12) {
        for (int i = 0; i < 6; i++) {
            String byteStr = macStr.substring(i * 2, i * 2 + 2);
            char *end;
            long byte = strtol(byteStr.c_str(), &end, 16);
            if (*end != 0) return false;
            macAddr[i] = (uint8_t)byte;
        }
        return true;
    }
    return false;
}

// Function to add peer and send identify request
void sendIdentifyRequest(const uint8_t *targetMac) {
    // Set up the message
    identifyMsg.message_type = IDENTIFY_SENDER_REQUEST;
    memcpy(identifyMsg.mac_address, targetMac, 6);
    
    // Set up peer info
    memcpy(peerInfo.peer_addr, targetMac, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    
    // Add peer
    if (esp_now_add_peer(&peerInfo) != ESP_OK) {
        outputMsgCode(ADD_PEER_FAILURE);
        return;
    }
    
    // Send the identify request
    esp_err_t result = esp_now_send(targetMac, (uint8_t*)&identifyMsg, sizeof(identifyMsg));
    if (result == ESP_OK) {
        outputData(IDENTIFY_REQUEST_SUCCESS, 0, 0, 0, targetMac);
    } else {
        outputData(IDENTIFY_REQUEST_FAILURE, 0, 0, 0, targetMac);
    }
}

void setup() {
    // Initialize serial
    Serial.begin(SERIAL_BAUD);
    while (!Serial) {
        delay(10);
    }
    outputMsgCode(ESP_HELLO);
    
    // Error LED setup (active LOW for this receiver)
    pinMode(ERROR_LED_PIN, OUTPUT);
    digitalWrite(ERROR_LED_PIN, HIGH); // LED off initially
    
    // ESP-NOW setup
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    
    if (esp_now_init() != ESP_OK) {
        outputMsgCode(ESP_NOW_INIT_FAILURE);
        digitalWrite(ERROR_LED_PIN, LOW); // LED on to indicate error
        return;
    }
    
    // Register callback for receiving data
    esp_now_register_recv_cb(OnDataRecv);
    outputMsgCode(ESP_READY);
}

void handleIdentifyRequest(const String &macStr) {
    uint8_t targetMac[6];
    if (parseMacAddress(macStr, targetMac)) {
        sendIdentifyRequest(targetMac);
    } else {
        outputMsgCode(INVALID_MAC_FORMAT);
    }
}


void sendLocalMacAddress() {
    uint8_t localMac[6];
    WiFi.macAddress(localMac);
    outputData(LOCAL_MAC, 0, 0, 0, localMac);
}


void loop() {
    // Check for serial input (message)
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
                    case IDENTIFY_SENDER_REQUEST:
                        handleIdentifyRequest(macStr);
                        break;
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
