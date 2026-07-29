import { useState, useEffect, useRef, useCallback } from 'react';

import { MessageType } from '../types';

interface SerialPortEvent {
    message_type: number;
    gps_s: number;
    gps_us: number;
    event: number;
    mac_address: string;
}

interface SerialPortStatus {
    isConnected: boolean;
    isAvailable: boolean;
    portName: string | null;
    error: string | null;
    receiverMacAddress: string | null;
}

export const useSerialPort = (
    onEvent: (event: SerialPortEvent) => void,
    baudRate: number = 115200
) => {
    const [status, setStatus] = useState<SerialPortStatus>({
        isConnected: false,
        isAvailable: false,
        portName: null,
        error: null,
        receiverMacAddress: null
    });
    
    const portRef = useRef<SerialPort | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
    const bufferRef = useRef<string>('');

    // Check if Web Serial API is available
    useEffect(() => {
        const isAvailable = 'serial' in navigator;
        setStatus(prev => ({ ...prev, isAvailable }));
    }, []);

    const connect = useCallback(async () => {
        if (!('serial' in navigator)) {
            setStatus(prev => ({ ...prev, error: 'Web Serial API not supported in this browser' }));
            return false;
        }

        try {
            // Request the user to select a serial port
            portRef.current = await navigator.serial.requestPort();
            
            // Open the port
            await portRef.current.open({ baudRate });
            
            // Check if the port supports readable stream
            if (!portRef.current.readable) {
                throw new Error('Port is not readable');
            }

            setStatus({
                isConnected: true,
                isAvailable: true,
                portName: portRef.current.getInfo().usbProductName || portRef.current.getInfo().usbVendorName || null,
                error: null
            });

            // Create a text decoder stream
            const textDecoder = new TextDecoderStream();
            const readableStream = portRef.current.readable.pipeTo(textDecoder.writable);
            
            // Get the reader
            readerRef.current = textDecoder.readable.getReader();

            // Start reading
            readSerialData();

            return true;
        } catch (err) {
            console.log('Serial connection error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to connect to serial port';
            setStatus(prev => ({ ...prev, error: errorMessage, isConnected: false }));
            return false;
        }
    }, [baudRate]);

    const disconnect = useCallback(async () => {
        if (readerRef.current) {
            try {
                await readerRef.current.cancel();
            } catch {
                // Ignore cancel errors
            }
            readerRef.current = null;
        }

        if (portRef.current) {
            try {
                await portRef.current.close();
            } catch {
                // Ignore close errors
            }
            portRef.current = null;
        }

        bufferRef.current = '';
        setStatus(prev => ({ ...prev, isConnected: false, error: null }));
    }, []);

    const readSerialData = useCallback(async () => {
        if (!readerRef.current) return;

        try {
            while (true) {
                const { value, done } = await readerRef.current.read();
                
                if (done) {
                    // Stream completed
                    disconnect();
                    break;
                }

              if (value) {
                    console.log(value)
                    // Accumulate data in buffer
                    bufferRef.current += value;
                    
                    // Process complete lines (ended with newline)
                    const lines = bufferRef.current.split('\n');
                    bufferRef.current = lines.pop() || ''; // Keep incomplete line
                    
                    for (const line of lines) {
                        if (line.trim()) {
                            processLine(line.trim());
                        }
                    }
                }
            }
        } catch (err) {
            // If the reader is cancelled, that's expected during disconnect
            if (err instanceof Error && err.name !== 'AbortError') {
                setStatus(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Serial read error' }));
            }
            disconnect();
        }
    }, [disconnect]);

    // Send a message to the serial port
    const sendMessage = useCallback(async (messageType: number, macAddress?: string) => {
        if (!portRef.current || !portRef.current.writable) {
            console.error('Serial port is not writable');
            return;
        }
        
        try {
            const writer = portRef.current.writable.getWriter();
            let message = `${messageType}`;
            if (macAddress) {
                message += `,${macAddress}`;
            }
            message += '\n';
            
            await writer.write(new TextEncoder().encode(message));
            writer.releaseLock();
        } catch (err) {
            console.error('Failed to send message:', err);
            setStatus(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Failed to send message' }));
        }
    }, []);
    
    // Request receiver's MAC address on connection
    const requestReceiverMac = useCallback(async () => {
        if (!status.isConnected) return;
        await sendMessage(MessageType.IDENTIFY_RECEIVER_REQUEST);
    }, [status.isConnected, sendMessage]);
    
    const processLine = useCallback((line: string) => {
        // Expected format: message_type,gps_s,gps_us,event,mac_address
        // Example: 1,1708081234,123456,1,AA:BB:CC:DD:EE:FF
        try {
            const parts = line.split(',');
            if (parts.length < 1) {
                console.warn('Invalid serial data format:', line);
                return;
            }
            
            const messageType = parseInt(parts[0]);
            
            // Handle IDENTIFY_RECEIVER_REQUEST response (LOCAL_MAC = 9)
            if (messageType === 9 && parts.length === 5) { // LOCAL_MAC message
                const macAddress = parts[4];
                setStatus(prev => ({ ...prev, receiverMacAddress: macAddress }));
                return;
            }
            
            // For BEAM_EVENT messages, we need all 5 parts
            if (messageType === 1 && parts.length === 5) {  // BEAM_EVENT = 1
                const event: SerialPortEvent = {
                    message_type: messageType,
                    gps_s: parseInt(parts[1]),
                    gps_us: parseInt(parts[2]),
                    event: parseInt(parts[3]),
                    mac_address: parts[4]
                };
                
                onEvent(event);
            }
        } catch (err) {
            console.error('Failed to parse serial line:', line, err);
        }
    }, [onEvent]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        status,
        connect,
        disconnect,
        sendMessage,
        requestReceiverMac
    };
};
