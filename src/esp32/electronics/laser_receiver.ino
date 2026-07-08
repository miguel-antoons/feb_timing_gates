const int SENSOR_PIN = 0;          // digitale interrupt-pin

volatile unsigned long lastTime = 0;
volatile bool locked = false;      // blokkeer nieuwe metingen

volatile unsigned long interval = 0;
// minimaal interval tussen 2 geldige passages (in µs)
const unsigned long MIN_INTERVAL_US = 1000000;   // 100 ms

void IRAM_ATTR beamISR() {
  if (locked) return;              // negeer zolang we 'gelocked' zijn

  unsigned long now = micros();

  if (lastTime != 0) {
    interval = now - lastTime;
    Serial.println(interval);      // tijd tussen 2 passages in µs
  }

  lastTime = now;
  locked = true;                   // vanaf nu niets meer toestaan
}

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT);      // of INPUT_PULLUP
  attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), beamISR, FALLING);
}

void loop() {
  // lock na een tijd weer vrijgeven
  if (locked && (micros() - lastTime > MIN_INTERVAL_US)) {
    locked = false;
  }

  // verder niets nodig
}
