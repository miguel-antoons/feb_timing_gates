import { useState, useEffect, useRef, useCallback } from 'react';

interface SerialPortEvent {
    gate_id: number;
    gps_s: number;
    gps_us: number;
    beam: boolean;
    event_id: number;
}

interface SerialPortStatus {
    isConnected: boolean;
    isAvailable: boolean;
    portName: string | null;
    error: string | null;
}

export const useSerialPort = (
    onEvent: (event: SerialPortEvent) => void,
    baudRate: number = 115200
) => {
    const [status, setStatus] = useState<SerialPortStatus>({
        isConnected: false,
        isAvailable: false,
        portName: null,
        error: null
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

    const processLine = useCallback((line: string) => {
        // Expected format: gate_id,gps_s,gps_us,beam_broken,event_id
        // Example: 1,1708081234,123456,1,42
        try {
            const parts = line.split(',');
            if (parts.length !== 5) {
                console.warn('Invalid serial data format:', line);
                return;
            }

            const event: SerialPortEvent = {
                gate_id: parseInt(parts[0]),
                gps_s: parseInt(parts[1]),
                gps_us: parseInt(parts[2]),
                beam: parseInt(parts[3]) === 1,
                event_id: parseInt(parts[4])
            };

            onEvent(event);
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
        disconnect
    };
};
