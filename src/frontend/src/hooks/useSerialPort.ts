import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { MessageType, SerialPortEvent, SerialPortStatus } from '../types';

export const useSerialPort = (
  onEvent: (event: SerialPortEvent) => void,
  baudRate: number = 115200
) => {
  const [status, setStatus] = useState<SerialPortStatus>({
    isConnected: false,
    isAvailable: true, // Assuming Tauri backend is always available
    portName: null,
    error: null,
    receiverMacAddress: null
  });

  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Re-used logic from your original processLine
  const processLine = useCallback((line: string) => {
    try {
      const parts = line.split(',');
      if (parts.length < 1) return;
      
      const messageType = parseInt(parts[0]);
      
      if (messageType === 9 && parts.length === 5) {
        setStatus(prev => ({ ...prev, receiverMacAddress: parts[4] }));
        return;
      }
      
      if (messageType === 1 && parts.length === 5) {
        onEvent({
          message_type: messageType,
          gps_s: parseInt(parts[1]),
          gps_us: parseInt(parts[2]),
          event: parseInt(parts[3]),
          mac_address: parts[4]
        });
      }
    } catch (err) {
      console.error('Failed to parse line:', line, err);
    }
  }, [onEvent]);

  // Connect is now an IPC call to Rust
  const connect = useCallback(async (selectedPortName: string) => {
    try {
      await invoke('open_port', { portName: selectedPortName, baudRate });
      
      setStatus(prev => ({
        ...prev,
        isConnected: true,
        portName: selectedPortName,
        error: null
      }));

      // Listen for data events emitted by the Rust backend
      unlistenRef.current = await listen<string>('serial-data', (event) => {
        // Rust should send complete lines, so no buffer splitting needed here!
        const line = event.payload.trim();
        if (line) processLine(line);
      });

      return true;
    } catch (err) {
      setStatus(prev => ({ ...prev, error: String(err), isConnected: false }));
      return false;
    }
  }, [baudRate, processLine]);

  // Disconnect is an IPC call to Rust
  const disconnect = useCallback(async () => {
    try {
      await invoke('close_port');
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
      setStatus(prev => ({ ...prev, isConnected: false, error: null }));
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  }, []);

  // Sending messages routes through Rust
  const sendMessage = useCallback(async (messageType: number, macAddress?: string) => {
    if (!status.isConnected) return;
    
    let message = `${messageType}`;
    if (macAddress) message += `,${macAddress}`;
    message += '\n';
    
    try {
      await invoke('write_port', { message });
    } catch (err) {
      setStatus(prev => ({ ...prev, error: String(err) }));
    }
  }, [status.isConnected]);

  const requestReceiverMac = useCallback(async () => {
    if (!status.isConnected) return;
    await sendMessage(MessageType.IDENTIFY_RECEIVER_REQUEST);
  }, [status.isConnected, sendMessage]);

  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return { status, connect, disconnect, sendMessage, requestReceiverMac };
};