#include <esp_now.h>
#include <WiFi.h>

const int ERROR_LED_PIN = 8;

uint8_t broadcastAddress[] = {0x1C, 0xDB, 0xD4, 0x3B, 0xA5, 0xF0};

typedef struct struct_message {
  uint8_t gate_id;
  uint32_t timestamp_s;     // Timestamp in seconden (van GPS)
  uint32_t timestamp_us;    // Microseconden sinds laatste seconde (0-999999)
  bool beam_broken;
  uint32_t event;
} struct_message;

struct_message myData;
esp_now_peer_info_t peerInfo;

uint32_t eventCounter = 0;

volatile bool lastSendDone   = true;
volatile bool lastSendOk     = false;

void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
  lastSendDone = true;
  lastSendOk   = (status == ESP_NOW_SEND_SUCCESS);
  Serial.print("\r\nLast Packet Send Status:\t");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}
 
void setup() {
  Serial.begin(115200);
  pinMode(ERROR_LED_PIN, OUTPUT);
  digitalWrite(ERROR_LED_PIN, HIGH); // LED off (reversed logic for built in LED)
  WiFi.mode(WIFI_STA);

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
  
  // Add peer        
  if (esp_now_add_peer(&peerInfo) != ESP_OK){
    Serial.println("Failed to add peer");
    digitalWrite(ERROR_LED_PIN, LOW);
    return;
  }
}

bool sendWithRetry(struct_message *msg,
                   const uint8_t *addr,
                   uint8_t maxRetries = 5,
                   uint16_t timeoutMs = 100) {
  for (uint8_t attempt = 0; attempt < maxRetries; attempt++) {
    lastSendDone = false;
    lastSendOk   = false;

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
      return true; // succes
    } else {
      Serial.printf("Send FAILED on attempt %u\n", attempt + 1);
    }
  }
  return false; // alle pogingen mislukt
}

void loop() {
  myData.gate_id      = 1;
  myData.timestamp_s  = 1234567890;
  myData.timestamp_us = 10245;
  myData.beam_broken  = true;

  eventCounter++;
  myData.event = eventCounter;

  bool ok = sendWithRetry(&myData, broadcastAddress, 5, 100);

  if (!ok) {
    Serial.println("Final failure after retries");
    digitalWrite(ERROR_LED_PIN, LOW);
    delay(5000);
    digitalWrite(ERROR_LED_PIN, HIGH);
  }

  delay(5000);
}