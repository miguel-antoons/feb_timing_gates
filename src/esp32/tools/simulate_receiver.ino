#include <Arduino.h>

// Fixed MAC address for simulation (format: XX:XX:XX:XX:XX:XX)
const uint8_t SIMULATED_MAC[6] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF};

// Serial output configuration
const unsigned long SERIAL_BAUD = 115200;
const unsigned long SEND_INTERVAL_MS = 3000;  // 3 seconds

// Simulation state
unsigned long lastSendTime = 0;

void setup() {
    // Initialize serial
    Serial.begin(SERIAL_BAUD);
    while (!Serial) {
        delay(10);
    }
    
    Serial.println("ESP32 Laser GPS Receiver Simulator");
    Serial.println("Simulating beam events every 3 seconds...");
    Serial.println("Format: [timestamp_s],[timestamp_us],[event],[MAC_ADDRESS]");
}

void loop() {
    unsigned long currentTime = millis();
    
    // Check if it's time to send a simulated message
    if (currentTime - lastSendTime >= SEND_INTERVAL_MS) {
        lastSendTime = currentTime;
        
        // Generate random data for simulation
        uint32_t timestamp_s = random(1700000000, 1800000000);  // Random timestamp in 2023-2024
        uint32_t timestamp_us = random(0, 999999);              // Random microseconds (0-999999)
        uint32_t event = random(1, 100);                         // Random event ID (1-99)
        
        // Print simulated beam event in the same format as the real receiver
        Serial.print(timestamp_s);
        Serial.print(",");
        Serial.print(timestamp_us);
        Serial.print(",");
        Serial.print(event);
        Serial.print(",");
        
        // Print MAC address as hex values
        for (int i = 0; i < 6; i++) {
            Serial.printf("%02X", SIMULATED_MAC[i]);
            if (i < 5) Serial.print(":");
        }
        Serial.println();
    }
    
    // Small delay to reduce CPU usage
    delay(10);
}