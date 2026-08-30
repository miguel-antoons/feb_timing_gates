# FEB Timing System

A real-time timing system for racing events, powered by ESP32-based wireless timing gates and a modern dashboard interface.

## Project Structure

```
FEB-Timing/
├── src/
│   ├── frontend/             # React dashboard (Vite + Tauri)
│   │   ├── src/
│   │   │   ├── App.tsx       # Main React application
│   │   │   ├── components/   # UI components for live timing data
│   │   │   ├── pages/        # Page-level components
│   │   │   └── ...           # Hooks, utilities, and assets
│   │   └── ...               # Config files (package.json, vite.config.ts, etc.)
│   └── esp32/                # ESP32 firmware for timing gates
│       ├── sender.ino        # ESP32 sender firmware (timing gate)
│       └── receiver.ino      # ESP32 receiver firmware (data collector)
├── .github/                  # GitHub workflows for automated releases
└── documentation/            # Complete system documentation
```

---

## Installation

Pre-built binaries for all platforms are available on the [GitHub Releases page](https://github.com/miguel-antoons/feb_timing_gates/releases). Download the appropriate version for your platform:

| Platform | Asset Name                     | Installation Instructions                     |
|----------|--------------------------------|-----------------------------------------------|
| Windows  | `feb-timing-gates_x.x.x_x64.msi` | Run the installer and follow the prompts      |
| macOS    | `feb-timing-gates_x.x.x_aarch64.dmg` | Open the DMG and drag to Applications folder |
| Linux (.deb)    | `feb-timing-gates_x.x.x_amd64.deb`  | Install with `sudo apt install ./feb-timing-gates*.deb` (preferred) or `sudo dpkg -i feb-timing-gates*.deb` |
| Linux (.rpm)    | `feb-timing-gates_x.x.x_x86_64.rpm` | Install with `sudo rpm -i feb-timing-gates*.rpm` |
| Linux (AppImage)| `feb-timing-gates_x.x.x_x86_64.AppImage` | Make executable with `chmod +x feb-timing-gates*.AppImage` and run directly |

For manual installation from source, see the [Software Setup Guide](documentation/SOFTWARE_SETUP.md).

---

## Documentation

The full documentation is available in the [`documentation/`](documentation/INDEX.md) directory. Start with the [Documentation Index](documentation/INDEX.md) for a complete overview of available resources.

| Document | Description |
|----------|-------------|
| [Project Overview](documentation/PROJECT_OVERVIEW.md) | System architecture and components |
| [Hardware Setup](documentation/HARDWARE_SETUP.md) | Physical setup of timing gates |
| [Software Setup](documentation/SOFTWARE_SETUP.md) | Installation and configuration |
| [Usage Guide](documentation/USAGE_GUIDE.md) | Operating the timing system |
| [Communication Protocol](documentation/COMMUNICATION_PROTOCOL.md) | Technical details about device communication |
| [Device Management](documentation/DEVICE_MANAGEMENT.md) | Managing timing gates and receivers |
| [Troubleshooting](documentation/TROUBLESHOOTING.md) | Common issues and solutions |
