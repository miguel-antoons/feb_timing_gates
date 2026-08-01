import { useSerialPort } from '@/hooks/useSerialPort';
import { Lap, MessageType, Sender, SessionStatus } from '@/src/types';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { SenderList } from '../panes/SenderList';
import { TimerPanel } from '../components/TimerPanel';
import { SessionControls } from '../components/SessionControls';
import { LapSpeed } from '../components/TrapSpeed';
import { EventTable } from '../panes/EventTable';


export const TimingGates: React.FC = () => {
  // --- State ---
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [currentTime, setCurrentTime] = useState(0); // The running time for current lap
  const [laps, setLaps] = useState<Lap[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [manualTriggerEnabled, setManualTriggerEnabled] = useState(false);
  const [events, setEvents] = useState<Array<{
    timestamp: number;
    timeDiff: number;
    event: number;
    macAddress: string;
    senderAlias: string;
    speed?: number; // Speed between gates
  }>>([]);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);

  // Data Capture for current lap
  const [currentSectorTime, setCurrentSectorTime] = useState<number | null>(null); // Time from G1 -> G2
  const [lastTrapSpeed, setLastTrapSpeed] = useState<number | null>(null);
  const [gateDistance, setGateDistance] = useState(75);
  const [senderDistances, setSenderDistances] = useState<Record<string, number>>({});

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

      // Calculate lap speed (full lap distance / lap time)
      const totalLapDistance = senders.length > 1 ? Object.values(senderDistances).reduce((sum: number, dist: number) => sum + dist, 0) : gateDistance;
      const lapSpeed = totalLapDistance > 0 ? ((totalLapDistance / (finalLapTime / 1000)) * 3.6) : 0;

      const newLap: Lap = {
        number: laps.length + 1,
        timeMs: finalLapTime,
        formattedTime: formatMs(finalLapTime),
        sector1Ms: currentSectorTime || undefined,
        sector1: currentSectorTime ? (currentSectorTime / 1000).toFixed(4) : '-',
        speed: lastTrapSpeed || undefined,
        lapSpeed: Math.round(lapSpeed),
        delta: delta,
        timestamp: new Date(),
        isBest: finalLapTime <= currentBest,
        senderId: selectedSender || undefined
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

      // Calculate Speed using the appropriate distance
      const distance = selectedSender ? (senderDistances[selectedSender] || gateDistance) : gateDistance;
      const timeInSeconds = sectorTime / 1000;
      const calculatedSpeed = (distance / timeInSeconds) * 3.6;
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

  // Soft reset - keeps previous times but resets current session
  const handleSoftReset = () => {
    if (status === SessionStatus.RUNNING) {
      setStatus(SessionStatus.STOPPED);
    }
    setCurrentTime(0);
    setCurrentSectorTime(null);
    setLastTrapSpeed(null);
    lapStartRef.current = null;
    
    // Add a clear marker to events
    setEvents(prev => [{
      timestamp: performance.now() * 1000, // Convert to microseconds
      timeDiff: 0,
      event: 0, // Special event type for clear marker
      macAddress: 'system',
      senderAlias: 'System',
      speed: 0
    }, ...prev.slice(0, 49)]);
  };

  // Manual trigger function
  const handleManualTrigger = () => {
    if (manualTriggerEnabled) {
      const now = performance.now();
      const timestamp = now * 1000; // Convert to microseconds for consistency
        
      // Log the manual trigger event (event: 3, senderAlias: "Manual Trigger")
      setEvents(prev => [{
        timestamp,
        timeDiff: 0, // No time difference for manual triggers
        event: 3, // Distinct event type for manual triggers
        macAddress: 'manual',
        senderAlias: 'Manual Trigger',
        speed: undefined // Speed is unknown for manual triggers
      }, ...prev.slice(0, 49)]); // Keep last 50 events
        
      handleGate1();
    }
  };

  // Update sender distance
  const updateSenderDistance = (macAddress: string, distance: number) => {
    setSenderDistances(prev => ({
      ...prev,
      [macAddress]: distance
    }));
    
    // Also update the sender in the list
    setSenders(prev => prev.map(sender =>
      sender.macAddress === macAddress ? { ...sender, distanceToNext: distance } : sender
    ));
  };

  // Reorder senders (for drag and drop)
  const reorderSenders = (newOrder: Sender[]) => {
    setSenders(newOrder.map((sender, index) => ({
      ...sender,
      order: index
    })));
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

  const handleExportEvents = () => {
    const headers = "Timestamp,TimeDiff,Event,MacAddress,SenderAlias,Speed_kmh\n";
    const rows = events.map(e =>
      `${new Date(Math.floor(e.timestamp / 1000)).toISOString()},${(e.timeDiff / 1000000).toFixed(6)},${e.event},${e.macAddress},${e.senderAlias},${e.speed || 0}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FEB_events_${new Date().toISOString()}.csv`;
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
          alias: generateDefaultAlias(macAddress),
          order: prev.length
        }];
      }
      return prev;
    });
    
    // Calculate time difference from last event for this sender
    const lastTime = lastEventTimeRef.current[macAddress] || timestamp;
    const timeDiff = timestamp - lastTime;
    lastEventTimeRef.current[macAddress] = timestamp;
    
    // Calculate speed if we have a distance for this sender
    const distance = senderDistances[macAddress] || gateDistance;
    const speed = timeDiff > 0 ? ((distance / (timeDiff / 1000000)) * 3.6) : 0;
    
    // Add event to the events list
    setEvents(prev => [{
      timestamp,
      timeDiff,
      event: event.event,
      macAddress,
      senderAlias: senders.find(s => s.macAddress === macAddress)?.alias || generateDefaultAlias(macAddress),
      speed: speed
    }, ...prev.slice(0, 49)]); // Keep last 50 events
    
    // If this sender is selected, trigger the appropriate handler
    if (selectedSender === macAddress) {
      if (event.event === 1) {
        handleGate1();
      } else if (event.event === 2) {
        handleGate2();
      }
    }
  }, [handleGate1, handleGate2, selectedSender, senders, senderDistances, gateDistance]);

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
              onUpdateDistance={updateSenderDistance}
              onReorder={reorderSenders}
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
              sectorTimes={[]} // Placeholder for future multi-gate support
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SessionControls
                status={status}
                onStopReset={handleStopReset}
                onSoftReset={handleSoftReset}
                onExport={handleExport}
                onExportEvents={handleExportEvents}
                onManualTrigger={handleManualTrigger}
                manualTriggerEnabled={manualTriggerEnabled}
                onToggleManualTrigger={() => setManualTriggerEnabled(!manualTriggerEnabled)}
                serialStatus={serialStatus}
                onConnectSerial={connectSerial}
                onDisconnectSerial={disconnectSerial}
                selectedSender={selectedSender || null}
                onIdentifySender={selectedSender ? (macAddress) => {
                  sendMessage(MessageType.IDENTIFY_SENDER_REQUEST, macAddress);
                } : undefined}
              />
              <LapSpeed lastSpeed={lastTrapSpeed} gateDistance={gateDistance} lapSpeed={lastLap?.lapSpeed || null} />
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