#include <esp_now.h>
#include <WiFi.h>
#include <TinyGPS++.h>
#include <esp_wifi.h>

// Pin configuration
#define SENSOR_PIN 18

#define PPS_PIN 0
#define GPS_TX_PIN  1
#define GPS_RX_PIN  2

#define LED_PIN 15

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

// delays
#define IDENTIFY_LED_DURATION 3000 // 3 seconds
#define SEND_INTERVAL_MS 3000 // 3 seconds

// GPS variables
HardwareSerial gpsSerial(1);
TinyGPSPlus gps;

// Interrupt / Time Synchronization Variables
volatile uint64_t lastPpsTime = 0;
volatile bool pps_occurred = false;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

volatile uint32_t last_utc_epoch = 0;
volatile uint64_t base_pps_anchor_us = 0;
volatile bool time_is_synchronized = false;

// sensor state variables
int sensorState = 0;
bool beamAlreadyBroken = false;
uint32_t eventCounter = 0;

// ESP-NOW configuration
uint8_t receiverAddress[] = {0x10, 0xBD, 0xA3, 0x9E, 0x5D, 0x3C};  // address of the receiver (replace with actual MAC address of the receiver)
uint8_t localMacAddress[6];
volatile bool lastSendDone = true;
volatile bool lastSendOk = false;
uint32_t lastSendTime = 0;
esp_now_peer_info_t peerInfo;

// Error LED configuration
unsigned long identifyLedEndTime = 0;
bool identifyRequested = false;


typedef struct struct_message {
    uint8_t message_type;
    uint32_t timestamp_s;     // Unix Epoch Seconds
    uint32_t timestamp_us;    // Microseconds since last second (0-999999)
    uint32_t event;
    uint8_t mac_address[6];  // Sender's MAC address for identification
} struct_message;

struct_message myData;


// * ============================ GPS ============================

// Handle GPS PPS interrupt
void IRAM_ATTR handlePPS() {
    portENTER_CRITICAL_ISR(&timerMux);
    lastPpsTime = esp_timer_get_time();
    pps_occurred = true;
    portEXIT_CRITICAL_ISR(&timerMux);
}


// Convert TinyGPS date/time to Unix Epoch Seconds
uint32_t getEpochSeconds(TinyGPSDate d, TinyGPSTime t) {
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


// Safely get current synchronized time in seconds and fractional microseconds
bool getPreciseTime(uint32_t &sec, uint32_t &us) {
    if (!time_is_synchronized) return false;

    portENTER_CRITICAL(&timerMux);
    uint64_t anchor = base_pps_anchor_us;
    uint32_t base_epoch = last_utc_epoch;
    portEXIT_CRITICAL(&timerMux);

    uint64_t now_us = esp_timer_get_time();
    if (now_us < anchor) return false; // Guard against unanchored edge cases

    uint64_t elapsed_us = now_us - anchor;
    sec = base_epoch + (uint32_t)(elapsed_us / 1000000ULL);
    us = (uint32_t)(elapsed_us % 1000000ULL);
    return true;
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


// * ============================ ESP-NOW ============================

void sendMsgCode(uint8_t code) {
    struct_message msg;
    msg.message_type = code;
    msg.timestamp_s = 0;
    msg.timestamp_us = 0;
    msg.event = 0;
    memcpy(msg.mac_address, localMacAddress, 6);
    esp_now_send(receiverAddress, (uint8_t*)&msg, sizeof(msg));
}


// ESP-NOW callback when data is received
void OnDataRecv(const esp_now_recv_info_t *recv_info, const uint8_t *receivedData, int len) {
    if (len != sizeof(struct_message)) {
        sendMsgCode(RCVD_SIZE_MISMATCH);
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
            identifyRequested = true;
            identifyLedEndTime = millis() + IDENTIFY_LED_DURATION;
            digitalWrite(LED_PIN, LOW); // Turn LED on
        }
    }
}


// ESP-NOW callback when data is sent
void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
    lastSendDone = true;
    lastSendOk = (status == ESP_NOW_SEND_SUCCESS);
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


// * ============================= Initialization Functions ============================

bool initLed() {
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, HIGH); // LED off initially
    Serial.println("Identify LED initialized on pin " + String(LED_PIN));
    return true;
}

bool initSensor() {
    pinMode(SENSOR_PIN, INPUT_PULLUP);
    Serial.println("Laser sensor initialized on pin " + String(SENSOR_PIN));
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
    memcpy(peerInfo.peer_addr, receiverAddress, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    
    if (esp_now_add_peer(&peerInfo) != ESP_OK) {
        Serial.println("Failed to add peer");
        return false;
    }
    
    Serial.println("ESP-NOW initialized and ready");
    return true;
}


// * ============================ Setup & Loop ============================ */

void setup() {
    setenv("TZ", "UTC0", 1);
    tzset();
    // Initialize serial
    Serial.begin(115200);

    if (!initLed()) ESP.restart();
    if (!initSensor()) ESP.restart();
    if (!initGPSSerial()) ESP.restart();
    if (!initPPS()) ESP.restart();
    if (!initESPNow()) ESP.restart();
    if (!initGPSTimeSync()) ESP.restart();
    Serial.println("-----ESP initialized and ready to be used-----");
}



void loop() {
    readGPS();
    // Read laser sensor state
    sensorState = digitalRead(SENSOR_PIN);
    
    if (sensorState == HIGH && !beamAlreadyBroken) {
        uint32_t current_s = 0;
        uint32_t current_us = 0;
        if (getPreciseTime(current_s, current_us)) {
            myData.message_type = BEAM_EVENT;
            myData.timestamp_s = current_s;
            myData.timestamp_us = current_us;
            memcpy(myData.mac_address, localMacAddress, 6);
            myData.event = ++eventCounter;
            
            Serial.printf("Event #%lu Timestamp: %lu.%06lu\n", 
                            eventCounter, myData.timestamp_s, myData.timestamp_us);
            
            if (!sendWithRetry(&myData, receiverAddress, 5, 100)) {
                Serial.println("ESP-NOW send failed after retries");
            }
        }

        beamAlreadyBroken = true;
        lastSendTime = millis();
    } else if (beamAlreadyBroken) {
        if (millis() - lastSendTime >= SEND_INTERVAL_MS) beamAlreadyBroken = false;
    }
    
    // Handle identify LED timing
    if (identifyRequested) {
        if (millis() >= identifyLedEndTime) {
            // Time's up, turn LED off
            digitalWrite(LED_PIN, HIGH);
            identifyRequested = false;
            Serial.println("Identify LED turned off");
        }
    }
}