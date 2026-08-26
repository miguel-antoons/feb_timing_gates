// src-tauri/src/main.rs

// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{error, info};
use serialport::SerialPort;
use std::io::{BufRead, BufReader, Write};
use std::panic;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

// Global state to hold the active serial port connection
struct AppState {
    port: Mutex<Option<Box<dyn SerialPort>>>,
    stop_signal: Mutex<Option<Arc<AtomicBool>>>, // Added this line
}

#[tauri::command]
fn list_ports() -> Result<Vec<String>, String> {
    match serialport::available_ports() {
        Ok(ports) => Ok(ports.into_iter().map(|p| p.port_name).collect()),
        Err(e) => Err(format!("Failed to list ports: {}", e)),
    }
}

#[tauri::command]
fn open_port(
    app: AppHandle,
    state: State<'_, AppState>,
    port_name: String,
    baud_rate: u32,
) -> Result<(), String> {
    // Open the connection
    let port = serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_millis(10))
        .open()
        .map_err(|e| format!("Failed to open port: {}", e))?;

    let read_port = port
        .try_clone()
        .map_err(|e| format!("Failed to clone port for reading: {}", e))?;

    // Create the atomic stop signal
    let stop_signal = Arc::new(AtomicBool::new(false));

    // Save the writing end and the stop signal into our global state
    *state.port.lock().unwrap() = Some(port);
    *state.stop_signal.lock().unwrap() = Some(stop_signal.clone());

    // Spawn a background thread
    thread::spawn(move || {
        let mut reader = BufReader::new(read_port);
        let mut buffer = String::new();

        loop {
            // 1. Check if close_port was called. If so, exit the loop!
            if stop_signal.load(Ordering::Relaxed) {
                info!("Stopping read thread for {}", port_name);
                break; // This breaks the loop, ending the thread and dropping `read_port`
            }

            buffer.clear();
            match reader.read_line(&mut buffer) {
                Ok(bytes_read) if bytes_read > 0 => {
                    let _ = app.emit("serial-data", buffer.clone());
                }
                Ok(_) => {} // EOF
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {
                    // Timeout is expected, it allows the loop to continue and check stop_signal
                    continue;
                }
                Err(_) => {
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn write_port(state: State<'_, AppState>, message: String) -> Result<(), String> {
    let mut port_guard = state.port.lock().unwrap();
    if let Some(port) = port_guard.as_mut() {
        port.write_all(message.as_bytes())
            .map_err(|e| format!("Failed to write to port: {}", e))?;
        Ok(())
    } else {
        Err("Port is not currently open".to_string())
    }
}

#[tauri::command]
fn close_port(state: State<'_, AppState>) -> Result<(), String> {
    // 1. Drop the write handle
    let mut port_guard = state.port.lock().unwrap();
    *port_guard = None;

    // 2. Tell the read thread to shut down
    let mut signal_guard = state.stop_signal.lock().unwrap();
    if let Some(signal) = signal_guard.take() {
        signal.store(true, Ordering::Relaxed);
    }

    Ok(())
}

fn main() {
    panic::set_hook(Box::new(|panic_info| {
        error!("FATAL RUST PANIC: {}", panic_info);
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            port: Mutex::new(None),
            stop_signal: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            list_ports, open_port, write_port, close_port
        ])
        .plugin(
            tauri_plugin_log::Builder::new()
                // You can configure max file size, rotation, etc. here
                .level(log::LevelFilter::Info)
                .build(),
        )
        .setup(|_app| {
            info!("Application started successfully.");
            Ok(())
        })
        // 3. (Optional) Catch Webview/Window crashes in the event loop
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::Destroyed => {
                error!("Window '{}' was destroyed unexpectedly.", window.label());
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
