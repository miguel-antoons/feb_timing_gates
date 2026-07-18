#include <esp_now.h>
#include <WiFi.h>

// Serial output configuration
const unsigned long SERIAL_BAUD = 115200;

// Error LED configuration
const int ERROR_LED_PIN = 8;

// ESP-NOW message structure (must match sender)
typedef struct struct_message {
  uint8_t gate_id;
  uint32_t timestamp_s;     // Timestamp in seconds (from GPS)
  uint32_t timestamp_us;    // Microseconds since last second (0-999999)
  bool beam_broken;
  uint32_t event;
  uint8_t mac_address[6];  // Sender's MAC address for identification
} struct_message;

// Callback when data is received via ESP-NOW
void OnDataRecv(const uint8_t *mac, const uint8_t *receivedData, int len) {
  if (len != sizeof(struct_message)) {
    Serial.println("Error: Received data size does not match struct_message");
    return;
  }

  // Copy received data to local struct
  struct_message msg;
  memcpy(&msg, receivedData, sizeof(struct_message));

  // Format as CSV: gate_id,timestamp_s,timestamp_us,beam_broken,event
  // beam_broken is sent as 1 or 0
  Serial.print(msg.gate_id);
  Serial.print(",");
  Serial.print(msg.timestamp_s);
  Serial.print(",");
  Serial.print(msg.timestamp_us);
  Serial.print(",");
  Serial.print(msg.beam_broken ? 1 : 0);
  Serial.print(",");
  Serial.println(msg.event);

  // Blink LED briefly to indicate reception
  digitalWrite(ERROR_LED_PIN, LOW);
  delay(10);
  digitalWrite(ERROR_LED_PIN, HIGH);
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
}

void loop() {
  // Nothing to do here - everything is interrupt/callback driven
  // Small delay to reduce CPU usage
  delay(10);
}
