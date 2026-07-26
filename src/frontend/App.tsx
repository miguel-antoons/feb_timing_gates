import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { TimerPanel } from './components/TimerPanel';
import { LapTable } from './components/LapTable';
import { SessionControls } from './components/SessionControls';
import { TrapSpeed } from './components/TrapSpeed';
import { SenderList } from './components/SenderList';
import { EventTable } from './components/EventTable';
import { Lap, SessionStatus, Sender, MessageType } from './types';
import { useSerialPort } from './hooks/useSerialPort';

const App: React.FC = () => {
    // --- State ---
    const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
    const [currentTime, setCurrentTime] = useState(0); // The running time for current lap
    const [laps, setLaps] = useState<Lap[]>([]);
    const [senders, setSenders] = useState<Sender[]>([]);
    const [events, setEvents] = useState<Array<{
        timestamp: number;
        timeDiff: number;
        event: number;
        macAddress: string;
        senderAlias: string;
    }>>([]);
    const [selectedSender, setSelectedSender] = useState<string | null>(null);

    // Data Capture for current lap
    const [currentSectorTime, setCurrentSectorTime] = useState<number | null>(null); // Time from G1 -> G2
    const [lastTrapSpeed, setLastTrapSpeed] = useState<number | null>(null);
    const [gateDistance, setGateDistance] = useState(75);
    
    // Track last event time for each sender
    const lastEventTimeRef = useRef<Record<string, number>>({});

    // Refs
    const lapStartRef = useRef<number | null>(null);
    const requestRef = useRef<number | null>(null);

    // Derived Stats
    const currentLapNumber = laps.length + 1;
    const bestLap = laps.length > 0 ? laps.reduce((prev, curr) => (prev.timeMs < curr.timeMs ? prev : curr)) : null;
    const lastLap = laps.length > 0 ? laps[laps.length - 1] : null;

    // --- Animation Loop ---
    const animate = () => {
        if (status === SessionStatus.RUNNING && lapStartRef.current !== null) {
            const now = performance.now();
            setCurrentTime(now - lapStartRef.current);
            requestRef.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        if (status === SessionStatus.RUNNING) {
            if (!requestRef.current) {
                requestRef.current = requestAnimationFrame(animate);
            }
        } else {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
        }
    }, [status]);

    // --- Actions ---

    // Gate 1: START Session OR Trigger LAP
    const handleGate1 = () => {
        const now = performance.now();

        if (status === SessionStatus.IDLE || status === SessionStatus.STOPPED) {
            // START SESSION
            setStatus(SessionStatus.RUNNING);
            lapStartRef.current = now;
            setCurrentTime(0);

            // Reset sector/speed for the new run
            setCurrentSectorTime(null);
            setLastTrapSpeed(null);

        } else if (status === SessionStatus.RUNNING && lapStartRef.current !== null) {
            // LAP TRIGGER
            const finalLapTime = now - lapStartRef.current;

            // Calculate Delta
            const currentBest = laps.length > 0 ? Math.min(...laps.map(l => l.timeMs)) : finalLapTime;
            const delta = finalLapTime - currentBest;

            const newLap: Lap = {
                number: laps.length + 1,
                timeMs: finalLapTime,
                formattedTime: formatMs(finalLapTime),
                sector1Ms: currentSectorTime || undefined,
                sector1: currentSectorTime ? (currentSectorTime / 1000).toFixed(4) : '-',
                speed: lastTrapSpeed || undefined,
                delta: delta,
                timestamp: new Date(),
                isBest: finalLapTime <= currentBest
            };

            setLaps(prev => {
                const updated = [...prev, newLap];
                const globalBest = Math.min(...updated.map(l => l.timeMs));
                return updated.map(l => ({ ...l, isBest: l.timeMs === globalBest }));
            });

            // IMMEDIATELY START NEXT LAP
            lapStartRef.current = now;
            setCurrentTime(0);
            setCurrentSectorTime(null);
            setLastTrapSpeed(null);
        }
    };

    // Gate 2: Trap Speed Trigger
    const handleGate2 = () => {
        if (status === SessionStatus.RUNNING && lapStartRef.current !== null && !currentSectorTime) {
            const now = performance.now();
            const sectorTime = now - lapStartRef.current;

            setCurrentSectorTime(sectorTime);

            // Calculate Speed
            const timeInSeconds = sectorTime / 1000;
            const calculatedSpeed = (gateDistance / timeInSeconds) * 3.6;
            setLastTrapSpeed(Math.round(calculatedSpeed));
        }
    };

    // Stop / Reset Button
    const handleStopReset = () => {
        if (status === SessionStatus.RUNNING) {
            // STOP
            setStatus(SessionStatus.STOPPED);
        } else {
            // RESET
            setStatus(SessionStatus.IDLE);
            setLaps([]);
            setCurrentTime(0);
            setCurrentSectorTime(null);
            setLastTrapSpeed(null);
            lapStartRef.current = null;
        }
    };

    const handleExport = () => {
        const headers = "Lap,Time,S1_Time,Speed_kmh,Delta,Timestamp\n";
        const rows = laps.map(l =>
            `${l.number},${l.formattedTime},${l.sector1},${l.speed || 0},${(l.delta / 1000).toFixed(4)},${l.timestamp.toISOString()}`
        ).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FEB_timing_${new Date().toISOString()}.csv`;
        a.click();
    };

    const formatMs = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        // Calculate 10,000ths of a second (4 decimal places)
        const tenThousandths = Math.floor((ms % 1000) * 10);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenThousandths.toString().padStart(4, '0')}`;
    };

    // --- Serial Port Connection ---
    const serialBaudRate = 115200;

    // Generate a default alias for a new sender
    const generateDefaultAlias = (macAddress: string): string => {
        // Use last 3 bytes of MAC address for uniqueness
        const parts = macAddress.split(':');
        if (parts.length >= 3) {
            return `Sender-${parts.slice(-3).join('')}`;
        }
        return `Sender-${Math.floor(Math.random() * 1000)}`;
    };
    
    // Update sender alias
    const updateSenderAlias = useCallback((macAddress: string, newAlias: string) => {
        setSenders(prev => prev.map(sender => 
            sender.macAddress === macAddress ? { ...sender, alias: newAlias } : sender
        ));
    }, []);
    
    // Handle serial events
    const handleSerialEvent = useCallback((event: {
        message_type: number;
        gps_s: number;
        gps_us: number;
        event: number;
        mac_address: string
    }) => {
        // Only process BEAM_EVENT messages
        if (event.message_type !== MessageType.BEAM_EVENT) return;
        
        const timestamp = event.gps_s * 1000000 + event.gps_us;
        const macAddress = event.mac_address;
        
        // Add sender if not already known
        setSenders(prev => {
            if (!prev.some(sender => sender.macAddress === macAddress)) {
                return [...prev, {
                    macAddress,
                    alias: generateDefaultAlias(macAddress)
                }];
            }
            return prev;
        });
        
        // Calculate time difference from last event for this sender
        const lastTime = lastEventTimeRef.current[macAddress] || timestamp;
        const timeDiff = timestamp - lastTime;
        lastEventTimeRef.current[macAddress] = timestamp;
        
        // Add event to the events list
        setEvents(prev => [{
            timestamp,
            timeDiff,
            event: event.event,
            macAddress,
            senderAlias: senders.find(s => s.macAddress === macAddress)?.alias || generateDefaultAlias(macAddress)
        }, ...prev.slice(0, 49)]); // Keep last 50 events
        
        // If this sender is selected, trigger the appropriate handler
        if (selectedSender === macAddress) {
            if (event.event === 1) {
                handleGate1();
            } else if (event.event === 2) {
                handleGate2();
            }
        }
    }, [handleGate1, handleGate2, selectedSender, senders]);

    const {
        status: serialStatus,
        connect: connectSerial,
        disconnect: disconnectSerial,
        requestReceiverMac,
        sendMessage
    } = useSerialPort(handleSerialEvent, serialBaudRate);

    // Auto-connect when serial API is available (or provide UI to connect)
    useEffect(() => {
        if (serialStatus.isAvailable && !serialStatus.isConnected) {
            // We won't auto-connect; user needs to click a button due to browser security
            // This effect is here for future enhancements
        }
    }, [serialStatus.isAvailable, serialStatus.isConnected]);
    
    // Request receiver's MAC address when connected
    useEffect(() => {
        if (serialStatus.isConnected) {
            requestReceiverMac();
        }
    }, [serialStatus.isConnected, requestReceiverMac]);

    return (
        <div className="bg-background-dark text-text-main font-display overflow-x-hidden min-h-screen flex flex-col selection:bg-primary selection:text-black">
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                    {/* Left Column (Main Stats) */}
                    <div className="lg:col-span-3 flex flex-col gap-6 order-1 lg:order-1">
                        <SenderList
                            senders={senders}
                            selectedSender={selectedSender}
                            onSelectSender={setSelectedSender}
                            onUpdateAlias={updateSenderAlias}
                        />
                    </div>
                    
                    {/* Middle Column (Main Stats) */}
                    <div className="lg:col-span-6 flex flex-col gap-6 order-2 lg:order-2">
                        <TimerPanel
                            status={status}
                            currentTimeMs={currentTime}
                            currentSectorMs={currentSectorTime}
                            lapNumber={currentLapNumber}
                            lastLap={lastLap}
                            bestLap={bestLap}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SessionControls
                                status={status}
                                gateDistance={gateDistance}
                                onGate1={handleGate1}
                                onGate2={handleGate2}
                                onStopReset={handleStopReset}
                                onExport={handleExport}
                                onGateDistanceChange={setGateDistance}
                                serialStatus={serialStatus}
                                onConnectSerial={connectSerial}
                                onDisconnectSerial={disconnectSerial}
                                selectedSender={selectedSender || null}
                                onIdentifySender={selectedSender ? (macAddress) => {
                                    sendMessage(MessageType.IDENTIFY_SENDER_REQUEST, macAddress);
                                } : undefined}
                            />
                            <TrapSpeed lastSpeed={lastTrapSpeed} gateDistance={gateDistance} />
                        </div>
                    </div>

                    {/* Right Column (History) */}
                    <div className="lg:col-span-3 flex flex-col h-full gap-6 order-3 lg:order-3">
                        <EventTable events={events} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
