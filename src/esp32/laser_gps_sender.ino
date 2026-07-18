#include <esp_now.h>
#include <WiFi.h>

// Laser sensor configuration
const int SENSOR_PIN = 4;  // Pin connected to Banner sensor's black wire
int sensorState = 0;
bool beamBroken = false;

// GPS PPS configuration
#define PPS_PIN 10
volatile unsigned long ppsCounter = 0;
volatile unsigned long lastPpsTime = 0;
unsigned long lastGpsSecond = 0;

// ESP-NOW configuration
const int ERROR_LED_PIN = 8;
uint8_t broadcastAddress[] = {0x1C, 0xDB, 0xD4, 0x3B, 0xA5, 0xF0};

typedef struct struct_message {
  uint8_t gate_id;
  uint32_t timestamp_s;     // Timestamp in seconds (from GPS)
  uint32_t timestamp_us;    // Microseconds since last second (0-999999)
  bool beam_broken;
  uint32_t event;
  uint8_t mac_address[6];  // Sender's MAC address for identification
} struct_message;

struct_message myData;
esp_now_peer_info_t peerInfo;

uint32_t eventCounter = 0;
uint8_t localMacAddress[6];
volatile bool lastSendDone = true;
volatile bool lastSendOk = false;

// Handle GPS PPS interrupt
void IRAM_ATTR handlePPS() {
  lastPpsTime = micros();
  ppsCounter++;
  lastGpsSecond = lastPpsTime / 1000000;  // Convert to seconds
}

// ESP-NOW callback when data is sent
void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
  lastSendDone = true;
  lastSendOk = (status == ESP_NOW_SEND_SUCCESS);
  Serial.print("\r\nLast Packet Send Status:\t");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}

void setup() {
  // Initialize serial
  Serial.begin(115200);
  
  // Laser sensor setup
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  Serial.println("Laser sensor initialized on pin " + String(SENSOR_PIN));
  
  // GPS PPS setup
  pinMode(PPS_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(PPS_PIN), handlePPS, RISING);
  Serial.println("GPS 1PPS detector started on GPIO" + String(PPS_PIN));
  
  // Error LED setup
  pinMode(ERROR_LED_PIN, OUTPUT);
  digitalWrite(ERROR_LED_PIN, HIGH); // LED off (reversed logic)
  
  // ESP-NOW setup
  WiFi.mode(WIFI_STA);
  
  // Get local MAC address
  esp_read_mac_address(localMacAddress);
  Serial.print("Local MAC: ");
  for (int i = 0; i < 6; i++) {
    Serial.printf("%02X", localMacAddress[i]);
    if (i < 5) Serial.print(":");
  }
  Serial.println();
  
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    digitalWrite(ERROR_LED_PIN, LOW);
    return;
  }
  
  esp_now_register_send_cb(OnDataSent);
  
  // Register peer
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    digitalWrite(ERROR_LED_PIN, LOW);
    return;
  }
  
  Serial.println("ESP-NOW initialized and ready");
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
  // Read laser sensor state
  sensorState = digitalRead(SENSOR_PIN);
  
  // Check if beam state changed
  bool currentBeamState = (sensorState == HIGH);
  if (currentBeamState != beamBroken) {
    beamBroken = currentBeamState;
    
    // Get precise timestamp from GPS PPS
    unsigned long currentMicros = micros();
    unsigned long seconds = lastGpsSecond;
    unsigned long microseconds = currentMicros - (lastPpsTime % 1000000);
    
    // If we don't have a recent PPS signal, use system time as fallback
    if (millis() - (lastPpsTime / 1000) > 2000) {
      seconds = currentMicros / 1000000;
      microseconds = currentMicros % 1000000;
      Serial.println("Warning: Using system time (no recent GPS PPS signal)");
    }
    
    // Prepare data for sending
    myData.gate_id = 1;  // Unique ID for this gate
    myData.timestamp_s = seconds;
    myData.timestamp_us = microseconds;
    myData.beam_broken = beamBroken;
    memcpy(myData.mac_address, localMacAddress, 6);
    
    eventCounter++;
    myData.event = eventCounter;
    
    // Send data via ESP-NOW
    bool ok = sendWithRetry(&myData, broadcastAddress, 5, 100);
    
    if (!ok) {
      Serial.println("Final failure after retries");
      digitalWrite(ERROR_LED_PIN, LOW);
      delay(1000);
      digitalWrite(ERROR_LED_PIN, HIGH);
    }
    
    // Log event
    Serial.print("Event ");
    Serial.print(eventCounter);
    Serial.print(": Beam ");
    Serial.print(beamBroken ? "BROKEN" : "RESTORED");
    Serial.print(" at ");
    Serial.print(seconds);
    Serial.print(".");
    Serial.print(microseconds);
    Serial.println(beamBroken ? " - Sending alert" : "");
  }
  
  // Small delay to prevent flooding
  delay(10);
}