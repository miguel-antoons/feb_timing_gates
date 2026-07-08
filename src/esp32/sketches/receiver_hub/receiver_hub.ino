#include <esp_now.h>
#include <WiFi.h>

// Data structure matching the sender
typedef struct struct_message {
  uint8_t gate_id;
  uint32_t timestamp_s;
  uint32_t timestamp_us;
  bool beam_broken;
  uint32_t event;
} struct_message;

struct_message receivedData;

void OnDataRecv(const esp_now_recv_info_t *recv_info,
                const uint8_t *incomingData, int len) {
  // Verify correct message size
  if (len != sizeof(struct_message)) {
    Serial.printf("[ERROR] Wrong message size: %d bytes\n", len);
    return;
  }

  // Copy received data
  memcpy(&receivedData, incomingData, sizeof(struct_message));
  
  // Output as CSV: gate_id,timestamp_s,timestamp_us,beam_broken,event
  Serial.printf("%u,%u,%u,%d,%u\n",
                receivedData.gate_id,
                receivedData.timestamp_s,
                receivedData.timestamp_us,
                receivedData.beam_broken ? 1 : 0,
                receivedData.event);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n================================");
  Serial.println("HUB RECEIVER INITIALIZED");
  Serial.println("================================");

  // Initialize WiFi
  WiFi.mode(WIFI_STA);
  Serial.println("[OK] WiFi mode set to STA");

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERROR] ESP-NOW init failed!");
    while(1) delay(100);
  }
  Serial.println("[OK] ESP-NOW initialized");

  // Register receive callback
  esp_now_register_recv_cb(OnDataRecv);
  Serial.println("[OK] Receive callback registered");
  
  Serial.println("\nListening for laser gate events...");
  Serial.println("Output format: gate_id,timestamp_s,timestamp_us,beam_broken,event\n");
}

void loop() {
  delay(100);
}