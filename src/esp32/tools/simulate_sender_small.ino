#include <esp_now.h>
#include <WiFi.h>
#include <HardwareSerial.h>
#include <TinyGPS++.h>
#include <esp_wifi.h>

// GPS PPS configuration
#define GPS_RX_PIN  6
#define GPS_TX_PIN  7
#define PPS_PIN 10
volatile uint64_t lastPpsTime = 0;
volatile bool pps_occurred = false;
HardwareSerial gpsSerial(1);

uint32_t last_utc_epoch = 0;
uint64_t base_pps_anchor_us = 0;
bool time_is_synchronized = false;
TinyGPSPlus gps;


// ESP-NOW configuration
uint8_t broadcastAddress[] = {0x10, 0xBD, 0xA3, 0x9E, 0x5D, 0x3C};  // address of the receiver (replace with actual MAC address of the receiver)

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

typedef struct struct_message {
    uint8_t message_type;
    uint32_t timestamp_s;     // Timestamp in seconds (from GPS)
    uint32_t timestamp_us;    // Microseconds since last second (0-999999)
    uint32_t event;
    uint8_t mac_address[6];  // Sender's MAC address for identification
} struct_message;

struct_message myData;
esp_now_peer_info_t peerInfo;

uint32_t eventCounter = 0;
uint8_t localMacAddress[6];
volatile bool lastSendDone = true;
volatile bool lastSendOk = false;

// Non-blocking timer variables
uint32_t lastSendTime = 0;
const uint32_t SEND_INTERVAL_MS = 3000;


// ESP-NOW callback when data is received
void OnDataRecv(const esp_now_recv_info_t *recv_info, const uint8_t *receivedData, int len) {
    if (len != sizeof(struct_message)) {
        Serial.println("Error: Received data size does not match struct_message");
        return;
    }
    
    // Copy received data to local struct
    struct_message msg;
    memcpy(&msg, receivedData, sizeof(struct_message));
    
    // Check if this is an identify request and if it's for us
    if (msg.message_type == IDENTIFY_SENDER_REQUEST) {
        // Check if the target MAC matches our MAC
        bool isForUs = true;
        for (int i = 0; i < 6; i++) {
            if (msg.mac_address[i] != localMacAddress[i]) {
                isForUs = false;
                break;
            }
        }
        
        if (isForUs) {
            Serial.println("Identify request received for this sender!");
        }
    }
}

// ESP-NOW callback when data is sent
void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
    lastSendDone = true;
    lastSendOk = (status == ESP_NOW_SEND_SUCCESS);
    Serial.print("\r\nLast Packet Send Status:\t");
    Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}


bool initESPNow() {
    // ESP-NOW setup
    WiFi.mode(WIFI_STA);
    WiFi.disconnect(); // Stop background AP scanning
        
    // Disable Wi-Fi sleep
    esp_wifi_set_ps(WIFI_PS_NONE);
    
    // Lock strictly to channel 1
    esp_wifi_set_channel(1, WIFI_SECOND_CHAN_NONE);
    
    // Get local MAC address
    WiFi.macAddress(localMacAddress);
    Serial.print("Local MAC: ");
    for (int i = 0; i < 6; i++) {
        Serial.printf("%02X", localMacAddress[i]);
        if (i < 5) Serial.print(":");
    }
    Serial.println();
    
    if (esp_now_init() != ESP_OK) {
        Serial.println("Error initializing ESP-NOW");
        return false;
    }
    
    esp_now_register_send_cb(OnDataSent);
    esp_now_register_recv_cb(OnDataRecv);
    
    // CRITICAL: Clear the struct memory completely before setting values
    memset(&peerInfo, 0, sizeof(peerInfo)); 
    
    // Register peer
    memcpy(peerInfo.peer_addr, broadcastAddress, 6);
    peerInfo.channel = 1;      // Ensure this matches the channel we set above
    peerInfo.encrypt = false;
    
    if (esp_now_add_peer(&peerInfo) != ESP_OK) {
        Serial.println("Failed to add peer");
        return false;
    }
    Serial.println("ESP-NOW initialized and ready");
    return true;
}


void setup() {
    setenv("TZ", "UTC0", 1);
    tzset();
    // Initialize serial
    Serial.begin(115200);
    while (!Serial) {
        delay(10);
    }
    if (!initESPNow()) return;
    Serial.println("-----ESP initialized and ready to be used-----");
}

bool sendWithRetry(struct_message *msg, const uint8_t *addr, uint8_t maxRetries = 5, uint16_t timeoutMs = 100) {
    for (uint8_t attempt = 0; attempt < maxRetries; attempt++) {
        lastSendDone = false;
        lastSendOk = false;
    
        esp_err_t result = esp_now_send(addr, (uint8_t*)msg, sizeof(*msg));
        if (result != ESP_OK) {
            Serial.println("esp_now_send() failed immediately");
            continue;
        }
    
        uint32_t start = millis();
        while (!lastSendDone && (millis() - start < timeoutMs)) {
            delay(1);
        }
    
        if (lastSendDone && lastSendOk) {
            Serial.printf("Send OK on attempt %u\n", attempt + 1);
            return true;
        } else {
            Serial.printf("Send FAILED on attempt %u\n", attempt + 1);
        }
    }
    return false;
}

void loop() {
    if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
        lastSendTime = millis();
        
        // Prepare data for sending
        myData.message_type = BEAM_EVENT;
        
        // Calculate timestamp using the hardware timer
        myData.timestamp_s = random(1700000000, 1800000000);
        myData.timestamp_us = random(0, 999999);
        
        memcpy(myData.mac_address, localMacAddress, 6);
        myData.event = ++eventCounter;
        
        Serial.printf("New Event: %lu at %lu.%06lu\n", 
                        eventCounter, myData.timestamp_s, myData.timestamp_us);
        
        if (!sendWithRetry(&myData, broadcastAddress, 5, 100)) {
            Serial.println("Final failure after retries");
        }
    }
}