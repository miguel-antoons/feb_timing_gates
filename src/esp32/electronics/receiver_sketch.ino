#include <esp_now.h>
#include <WiFi.h>

typedef struct struct_message {
  uint8_t gate_id;
  uint32_t timestamp_s;     // Timestamp in seconden (van GPS)
  uint32_t timestamp_us;    // Microseconden sinds laatste seconde (0-999999)
  bool beam_broken;
  uint32_t event;
} struct_message;

struct_message myData;

void OnDataRecv(const esp_now_recv_info_t *recv_info,
                const uint8_t *incomingData, int len) {
  if (len != sizeof(struct_message)) {
    return;
  }

  memcpy(&myData, incomingData, sizeof(myData));
  
  Serial.printf("%u,%u,%u,%d,%u\n",
                myData.gate_id,
                myData.timestamp_s,
                myData.timestamp_us,
                myData.beam_broken ? 1 : 0,
                myData.event);
}

void setup() {
  Serial.begin(115200);
  delay(500);

  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }
  Serial.println("ESP-NOW initialized, waiting for data...");

  esp_now_register_recv_cb(OnDataRecv);
}

void loop() {

}