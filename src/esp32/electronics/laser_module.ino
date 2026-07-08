const int LASER_PIN = 4;
const int PWM_FREQ = 38000;
const int PWM_RESOLUTION = 8;
const int LASER_DUTY = 240; 

void setup() {
  // put your setup code here, to run once:
  ledcAttach(LASER_PIN, PWM_FREQ, PWM_RESOLUTION);
  ledcWrite(LASER_PIN, LASER_DUTY);
}

void loop() {
  // put your main code here, to run repeatedly:

}
