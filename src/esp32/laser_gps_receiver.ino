#include <esp_now.h>
#include <WiFi.h>

// Serial output configuration
const unsigned long SERIAL_BAUD = 115200;

// Error LED configuration
const int ERROR_LED_PIN = 8;

// Message types
#define MSG_BEAM_EVENT 1
#define MSG_IDENTIFY_REQUEST 2

// ESP-NOW message structure (must match sender)
typedef struct struct_message {
    uint8_t message_type;
    uint32_t timestamp_s;     // Timestamp in seconds (from GPS)
    uint32_t timestamp_us;    // Microseconds since last second (0-999999)
    uint32_t event;
    uint8_t mac_address[6];  // Sender's MAC address for identification
} struct_message;

// For sending identify requests
struct_message identifyMsg;
esp_now_peer_info_t peerInfo;

// Callback when data is received via ESP-NOW
void OnDataRecv(const uint8_t *mac, const uint8_t *receivedData, int len) {
    if (len != sizeof(struct_message)) {
        Serial.println("Error: Received data size does not match struct_message");
        return;
    }
    
    // Copy received data to local struct
    struct_message msg;
    memcpy(&msg, receivedData, sizeof(struct_message));
    
    // Only process beam events (ignore identify requests)
    if (msg.message_type == MSG_BEAM_EVENT) {
        // [timestamp_s],[timestamp_us],[event],[MAC_ADDRESS]
        Serial.print(msg.timestamp_s);
        Serial.print(",");
        Serial.print(msg.timestamp_us);
        Serial.print(",");
        Serial.print(msg.event);
        Serial.print(",");
        // Print MAC address as hex values
        for (int i = 0; i < 6; i++) {
            Serial.printf("%02X", msg.mac_address[i]);
            if (i < 5) Serial.print(":");
        }
        Serial.println();
    
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
    identifyMsg.message_type = MSG_IDENTIFY_REQUEST;
    memcpy(identifyMsg.mac_address, targetMac, 6);
    
    // Set up peer info
    memcpy(peerInfo.peer_addr, targetMac, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    
    // Add peer
    if (esp_now_add_peer(&peerInfo) != ESP_OK) {
        Serial.println("Error: Failed to add peer for identify request");
        return;
    }
    
    // Send the identify request
    esp_err_t result = esp_now_send(targetMac, (uint8_t*)&identifyMsg, sizeof(identifyMsg));
    if (result == ESP_OK) {
        Serial.print("Identify request sent to: ");
        for (int i = 0; i < 6; i++) {
            Serial.printf("%02X", targetMac[i]);
            if (i < 5) Serial.print(":");
        }
        Serial.println();
    } else {
        Serial.println("Error: Failed to send identify request");
    }
}

void setup() {
    // Initialize serial
    Serial.begin(SERIAL_BAUD);
    while (!Serial) {
        delay(10);
    }
    Serial.println("ESP32 Laser GPS Receiver");
    Serial.println("Waiting for ESP-NOW messages...");
    
    // Error LED setup (active LOW for this receiver)
    pinMode(ERROR_LED_PIN, OUTPUT);
    digitalWrite(ERROR_LED_PIN, HIGH); // LED off initially
    
    // ESP-NOW setup
    WiFi.mode(WIFI_STA);
    
    if (esp_now_init() != ESP_OK) {
        Serial.println("Error initializing ESP-NOW");
        digitalWrite(ERROR_LED_PIN, LOW); // LED on to indicate error
        return;
    }
    
    // Register callback for receiving data
    esp_now_register_recv_cb(OnDataRecv);
    
    // Get and print local MAC address
    uint8_t localMac[6];
    esp_read_mac_address(localMac);
    Serial.print("Receiver MAC: ");
    for (int i = 0; i < 6; i++) {
        Serial.printf("%02X", localMac[i]);
        if (i < 5) Serial.print(":");
    }
    Serial.println();
    
    Serial.println("ESP-NOW receiver ready. Waiting for data...");
    Serial.println("Enter a sender MAC address (format: XX:XX:XX:XX:XX:XX or XXXXXXXXXXXX) to identify it:");
}

void loop() {
    // Check for serial input (MAC address)
    if (Serial.available() > 0) {
        String input = Serial.readStringUntil('\n');
        input.trim();
        
        if (input.length() > 0) {
            uint8_t targetMac[6];
            if (parseMacAddress(input, targetMac)) {
                Serial.print("Parsed MAC: ");
                for (int i = 0; i < 6; i++) {
                    Serial.printf("%02X", targetMac[i]);
                    if (i < 5) Serial.print(":");
                }
                Serial.println();
                
                // Send identify request to the target MAC
                sendIdentifyRequest(targetMac);
            } else {
                Serial.print("Invalid MAC address format. Please use: XX:XX:XX:XX:XX:XX or XXXXXXXXXXXX. Got: ");
                Serial.println(input);
            }
        }
    }
    
    // Small delay to reduce CPU usage
    delay(10);
}
