# Software Setup

## Prerequisites

- **Arduino IDE** (for ESP32 firmware)
- **PlatformIO** (optional, alternative to Arduino IDE)
- **Node.js 18+** (for frontend dashboard)
- **Modern, Chromium based browser** (Brave, Chrome, or Chromium recommended)

## ESP32 Firmware Setup

### Arduino IDE Setup

1. Install the Arduino IDE from [https://www.arduino.cc/en/software](https://www.arduino.cc/en/software)
2. Add ESP32 board support:
   - Open File > Preferences
   - In the Additional boards manager URLs field, paste this exact link: [https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json](https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json)
   - Click OK
3. Install required libraries:
   - Open Tools > Board > Boards Manager
   - Search for esp32 and install the package by Espressif Systems
   - Search for TinyGPS++ and install the package by Mikal Hart

### Flashing the Firmware

#### Sender Firmware
1. Open `src/esp32/sender.ino` in Arduino IDE
2. Select the correct board: Go to Tools > Board > esp32 and select XIAO ESP32C6.
3. Go to Tools > USB CDC On Boot and change it to Enabled. Do not skip this step, or you won't see your sensor data in the serial monitor.
4. Select the correct port
    - Plug the ESP32-C6 into your computer via a data-capable USB-C cable (some cheap charging cables don't transmit data).
    - Go to Tools > Port and select the COM port that appeared when you plugged it in.
5. Update the receiver MAC address if needed (line 54):
   ```cpp
   uint8_t receiverAddress[] = {0x10, 0xBD, 0xA3, 0x9E, 0x5D, 0x3C};
   ```
6. Compile and upload the firmware

#### Receiver Firmware

Identical steps to the sender firmware, but open `src/esp32/receiver.ino` instead.

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000` (or the port shown in the console)

## Production Build

To create a production build of the frontend:

```bash
npm run build
```

The built files will be in the `dist` directory and can be served by any static file server.
