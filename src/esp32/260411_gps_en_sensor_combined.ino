#include <HardwareSerial.h>

#define GPS_RX_PIN  6
#define GPS_TX_PIN  7
#define PPS_PIN     10
#define SENSOR_PIN  3   // your phototransistor signal wire

HardwareSerial gpsSerial(1);

volatile uint32_t ppsTimestamp = 0;
volatile bool     ppsFlag      = false;
volatile uint8_t  gpsHour = 0, gpsMin = 0, gpsSec = 0;
volatile bool     gpsValid = false;

char    nmeaBuf[100];
uint8_t nmeaIdx = 0;

// --- Interrupts ---
void IRAM_ATTR onPPS() {
  ppsTimestamp = micros();
  ppsFlag = true;
  if (gpsValid) {
    gpsSec++;
    if (gpsSec >= 60) { gpsSec = 0; gpsMin++; }
    if (gpsMin >= 60)  { gpsMin = 0; gpsHour++; }
    if (gpsHour >= 24)   gpsHour = 0;
  }
}

void IRAM_ATTR onBeamBreak() {
  if (!gpsValid) return;
  uint32_t eventUs = micros();

  // Time since last PPS pulse + GPS wall time
  uint32_t offset = eventUs - ppsTimestamp;
  uint32_t totalUs = (uint32_t)gpsSec * 1000000UL + offset;
  uint8_t  s  = totalUs / 1000000UL;
  uint32_t us = totalUs % 1000000UL;

  // Can't use Serial.printf in ISR safely on ESP32, use Serial.print
  Serial.print("BEAM BROKEN: ");
  Serial.print(gpsHour); Serial.print(":");
  Serial.print(gpsMin);  Serial.print(":");
  Serial.print(s);       Serial.print(".");
  Serial.print(us);      Serial.println(" UTC");
  // Example: 22:11:33.538 -> BEAM BROKEN: 20:11:33.100838 UTC
}

// --- NMEA ---
bool validateNMEA(const char* s) {
  uint8_t calc = 0;
  int i = 1;
  while (s[i] && s[i] != '*') calc ^= s[i++];
  if (s[i] != '*') return false;
  return calc == (uint8_t)strtol(&s[i + 1], nullptr, 16);
}

void parseNMEA(const char* s) {
  if (!validateNMEA(s)) return;
  bool isGGA = strncmp(s + 3, "GGA", 3) == 0;
  bool isRMC = strncmp(s + 3, "RMC", 3) == 0;
  if (!isGGA && !isRMC) return;

  const char* p = strchr(s, ',');
  if (!p || strlen(++p) < 6) return;

  uint8_t h = (p[0]-'0')*10 + (p[1]-'0');
  uint8_t m = (p[2]-'0')*10 + (p[3]-'0');
  uint8_t sc = (p[4]-'0')*10 + (p[5]-'0');

  if (isRMC) {
    const char* q = strchr(p, ',');
    if (!q || *(q+1) != 'A') { gpsValid = false; return; }
  }

  noInterrupts();
  gpsHour = h; gpsMin = m; gpsSec = sc; gpsValid = true;
  interrupts();
}

void readGPS() {
  while (gpsSerial.available()) {
    char c = gpsSerial.read();
    if (c == '$') nmeaIdx = 0;
    if (nmeaIdx < sizeof(nmeaBuf) - 1) nmeaBuf[nmeaIdx++] = c;
    if (c == '\n') { nmeaBuf[nmeaIdx] = '\0'; parseNMEA(nmeaBuf); nmeaIdx = 0; }
  }
}

// --- Setup & Loop ---
void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  delay(200);
  gpsSerial.print("$PCAS01,5*19\r\n");
  delay(100);
  gpsSerial.begin(115200, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  pinMode(PPS_PIN, INPUT);
  pinMode(SENSOR_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(PPS_PIN),    onPPS,       RISING);
  attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), onBeamBreak, FALLING);  // 1→0 = beam broken

  Serial.println("Ready. Waiting for GPS fix...");
}

void loop() {
  readGPS();

  if (ppsFlag) {
    ppsFlag = false;
    if (gpsValid) {
      uint8_t h, m, s; uint32_t ts;
      noInterrupts(); h = gpsHour; m = gpsMin; s = gpsSec; ts = ppsTimestamp; interrupts();
      Serial.printf("GPS: %02d:%02d:%02d UTC  |  loop offset: %lu µs\n", h, m, s, micros() - ts);
    } else {
      Serial.println("PPS received — no fix yet.");
    }
  }
}