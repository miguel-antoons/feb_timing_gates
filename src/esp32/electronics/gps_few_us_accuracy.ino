#define PPS_PIN 10
volatile unsigned long ppsCounter = 0;
volatile unsigned long lastPpsTime = 0;

const int IR_LED_PIN = 5;
const int PWM_FREQ = 100000;  // 100kHz
const int PWM_RESOLUTION = 8;

void IRAM_ATTR handlePPS() {
  lastPpsTime = micros();
  ppsCounter++;
}

void setup() {
  // LED setup
  ledcAttach(IR_LED_PIN, PWM_FREQ, PWM_RESOLUTION);
  ledcWrite(IR_LED_PIN, 128);  // 20% duty cycle

  Serial.begin(115200);
  pinMode(PPS_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(PPS_PIN), handlePPS, RISING);
  Serial.println("1PPS detector gestart op GPIO10");
}

void loop() {
  static unsigned long lastDisplayTime = 0;
  unsigned long currentTime = millis();
  
  // Toon 1PPS info elke seconde
  if (currentTime - lastDisplayTime >= 1000) {
    Serial.print("1PPS pulsen geteld: ");
    Serial.print(ppsCounter);
    Serial.print(" | Laatste puls op: ");
    Serial.print(lastPpsTime);
    Serial.println(" µs");
    
    lastDisplayTime = currentTime;
  }
}
