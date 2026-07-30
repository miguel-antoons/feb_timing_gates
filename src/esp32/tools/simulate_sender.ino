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



// ESP-NOW configuration
uint8_t broadcastAddress[] = {0x38, 0x18, 0x2B, 0x14, 0x65, 0xE4};  // address of the receiver (replace with actual MAC address of the receiver)

// Message types
#define MSG_BEAM_EVENT 1
#define MSG_IDENTIFY_REQUEST 2

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

// Handle GPS PPS interrupt
void IRAM_ATTR handlePPS() {
    lastPpsTime = esp_timer_get_time();
    pps_occurred = true;
}

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
    if (msg.message_type == MSG_IDENTIFY_REQUEST) {
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


uint32_t getEpochSeconds(TinyGPSDate d, TinyGPSTime t) {
    // Simple conversion or use <time.h> tm struct
    struct tm tm;
    tm.tm_year = d.year() - 1900;
    tm.tm_mon  = d.month() - 1;
    tm.tm_mday = d.day();
    tm.tm_hour = t.hour();
    tm.tm_min  = t.minute();
    tm.tm_sec  = t.second();
    tm.tm_isdst = 0;
    return (uint32_t)mktime(&tm);
}


void readGPS() {
    while (gpsSerial.available()) {
        char c = gpsSerial.read();
        if (gps.encode(c)) {
            if (gps.time.isUpdated() && gps.date.isValid()) {
                bool had_pps = false;
                uint64_t captured_pps = 0;
                
                portENTER_CRITICAL(&timerMux);
                if (pps_occurred) {
                    captured_pps = lastPpsTime;
                    pps_occurred = false;
                    had_pps = true;
                }
                portEXIT_CRITICAL(&timerMux);

                if (had_pps) {
                    uint32_t parsed_epoch = getEpochSeconds(gps.date, gps.time);
                    
                    portENTER_CRITICAL(&timerMux);
                    last_utc_epoch = parsed_epoch;
                    base_pps_anchor_us = captured_pps;
                    time_is_synchronized = true;
                    portEXIT_CRITICAL(&timerMux);
                }
            }
        }
    }
}


bool initGPSSerial() {
    gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
    delay(200);
    gpsSerial.print("$PCAS01,5*19\r\n"); 
    gpsSerial.flush();
    delay(100);
    gpsSerial.end();
    gpsSerial.begin(115200, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
    Serial.println("GPS Serial initialized at 115200 baud");
    return true;
}


bool initPPS() {
    pinMode(PPS_PIN, INPUT_PULLDOWN);
    attachInterrupt(digitalPinToInterrupt(PPS_PIN), handlePPS, RISING);
    Serial.println("GPS 1PPS detector started on GPIO" + String(PPS_PIN));
    return true;
}


bool initESPNow() {
    // ESP-NOW setup
    WiFi.mode(WIFI_STA);
    WiFi.disconnect(); // Stop background AP scanning
        
    // Disable Wi-Fi sleep
    esp_wifi_set_ps(WIFI_PS_NONE);
    
    // Get local MAC address
    WiFi.macAddress(localMacAddress);
    Serial.print("Local MAC: ");
    Serial.printf(
        "Local MAC: %02X:%02X:%02X:%02X:%02X:%02X\n", 
        localMacAddress[0], localMacAddress[1], localMacAddress[2], 
        localMacAddress[3], localMacAddress[4], localMacAddress[5]
    );
    
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
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    
    if (esp_now_add_peer(&peerInfo) != ESP_OK) {
        Serial.println("Failed to add peer");
        return false;
    }
    
    Serial.println("ESP-NOW initialized and ready");
    return true;
}


bool initGPSTimeSync() {
    Serial.println("Waiting for GPS time synchronization...");
    while (!time_is_synchronized) {
        readGPS();
        yield();
    }
    Serial.println("GPS time synchronized");
    return true;
}


void setup() {
    setenv("TZ", "UTC0", 1);
    tzset();
    // Initialize serial
    Serial.begin(115200);
    if (!initGPSSerial()) return;
    if (!initPPS()) return;
    if (!initESPNow()) return;
    if (!initGPSTimeSync()) return;
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
            readGPS();
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
    readGPS();

    if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
        lastSendTime = millis();
        
        // Prepare data for sending
        myData.message_type = MSG_BEAM_EVENT;
        
        // Calculate timestamp using the hardware timer
        uint32_t elapsed_us = esp_timer_get_time() - base_pps_anchor_us;
        myData.timestamp_s = last_utc_epoch + (elapsed_us / 1000000);
        myData.timestamp_us = elapsed_us % 1000000;
        
        memcpy(myData.mac_address, localMacAddress, 6);
        myData.event = ++eventCounter;
        
        Serial.printf("New Event: %lu at %lu.%06lu\n", 
                        eventCounter, myData.timestamp_s, myData.timestamp_us);
        
        if (!sendWithRetry(&myData, broadcastAddress, 5, 100)) {
            Serial.println("Final failure after retries");
        }
    }
}