#include <WiFi.h>

// Serial output configuration
const unsigned long SERIAL_BAUD = 115200;

void setup() {
    // Initialize serial
    Serial.begin(SERIAL_BAUD);
    while (!Serial) {
        delay(10);
    }
    Serial.println("ESP32 MAC Address Printer");
    WiFi.mode(WIFI_STA);
}

void loop() {
    // Get the ESP32's MAC address
    uint8_t mac[6];
    WiFi.macAddress(mac);
    
    // Print the MAC address
    Serial.print("MAC: ");
    for (int i = 0; i < 6; i++) {
        Serial.printf("%02X", mac[i]);
        if (i < 5) Serial.print(":");
    }
    Serial.println();
    
    // Print the MAC address in ino file format for copy-paste
    Serial.print("uint8_t mac[] = {0x");
    for (int i = 0; i < 6; i++) {
        Serial.printf("%02X", mac[i]);
        if (i < 5) Serial.print(", 0x");
    }
    Serial.println("};");
    
    // Delay between prints
    delay(1000);
}
