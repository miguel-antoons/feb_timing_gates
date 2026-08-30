# GitHub Workflows

This directory contains GitHub Actions workflows for the **FEB Timing Gates** project.

## Workflows

### [`build.yml`](./workflows/build.yml)

- **Trigger**: Runs on pushes and pull requests to the `main`/`master` branches.
- **Purpose**: Builds the Tauri application for **Ubuntu**, **Windows**, and **macOS** to ensure the codebase compiles successfully across all supported platforms.
- **Steps**:
  - Checks out the repository.
  - Sets up Node.js and Rust.
  - Installs platform-specific dependencies (Ubuntu only).
  - Installs frontend dependencies.
  - Builds the Tauri app.

### [`release.yml`](./workflows/release.yml)

- **Trigger**: Runs when a version tag (e.g., `v1.0.0`) is pushed to the repository.
- **Purpose**: Creates a **GitHub release** with pre-built binaries for **Windows (x64)**, **macOS (ARM64)**, and **Linux (x64)**.
- **Steps**:
  - Checks out the repository.
  - Sets up Node.js and Rust (with cross-compilation targets).
  - Installs platform-specific dependencies (Ubuntu only).
  - Installs frontend dependencies and builds the frontend.
  - Uses the `tauri-apps/tauri-action` to build and publish the release.
  - Automatically names the release after the pushed tag.