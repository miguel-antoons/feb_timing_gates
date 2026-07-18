// Define the ESP32 pin connected to the Banner sensor's black wire
const int sensorPin = 4; 

// Variable to store the current state of the sensor
int sensorState = 0;

void setup() {
  // Start the serial monitor to view the output
  Serial.begin(115200);

  // CRITICAL: You must use INPUT_PULLUP. 
  // This safely holds the pin at 3.3V when the NPN sensor is inactive.
  pinMode(sensorPin, INPUT_PULLUP);
  
  Serial.println("ESP32 and Banner Sensor Initialized.");
}

void loop() {
  // Read the state of the sensor pin
  sensorState = digitalRead(sensorPin);

  // Evaluate the NPN logic
  if (sensorState == HIGH) {
    // Pin is pulled HIGH by the ESP32 (NPN is floating)
    Serial.println("Object Detected! (Beam is blocked)");
  } else {
    // Pin is pulled LOW by the sensor (NPN is active)
    Serial.println("Path Clear. (Sensor sees the reflector)");
  }

  // Small delay to prevent flooding the serial monitor
  delay(100); 
}