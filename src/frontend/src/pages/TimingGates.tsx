import { useSerialPort } from '@/src/hooks/useSerialPort';
import { Lap, MessageType, Sender, SessionStatus, TimingEvent } from '@/src/types';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { SenderList } from '../panes/SenderList';
import { EventsPane } from '../panes/EventsPane';
import { toast, ToastProvider } from '@heroui/react';
import { CircleCheck } from '@gravity-ui/icons';

export const TimingGates: React.FC = () => {
  // --- State ---
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSessionId = localStorage.getItem('timingGatesSessionId');
      console.log('Loaded session ID from localStorage:', savedSessionId);
      return savedSessionId ? parseInt(savedSessionId, 10) : 1;
    }
    return 1;
  });
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [currentTime, setCurrentTime] = useState(0); // The running time for current lap
  const [laps, setLaps] = useState<Lap[]>([]);
  
  
  // Generate a default alias for a new sender
  const generateDefaultAlias = (macAddress: string): string => {
    // Use last 3 bytes of MAC address for uniqueness
    const parts = macAddress.split(':');
    if (parts.length >= 3) {
      return `Gate-${parts.slice(-3).join('')}`;
    }
    return `Gate-${Math.floor(Math.random() * 1000)}`;
  };
  
  const createDefaultSender = (macAddress: string): Sender => ({
    macAddress,
    alias: generateDefaultAlias(macAddress),
    distanceToPrevious: 1 // Default distance
  });

  const [senders, setSenders] = useState<Sender[]>([
    createDefaultSender('00:11:22:33:44:55'),
    createDefaultSender('66:77:88:99:AA:BB')
  ]);
  const [manualTriggerEnabled, setManualTriggerEnabled] = useState(false);
  const [events, setEvents] = useState<TimingEvent[]>(() => {
    // Load events from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem('timingGatesEvents');
      return savedEvents ? JSON.parse(savedEvents) : [];
    }
    return [];
  });
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

  
  const createNewSession = () => {
    setCurrentSessionId(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('timingGatesSessionId', JSON.stringify(currentSessionId + 1));
      }
      return currentSessionId + 1
    });
    toast("New session created", {
      indicator: <CircleCheck />,
      variant: "success",
    });
  }


  const resetAll = () => {
    setCurrentSessionId(1);
    setEvents([]);
    // Clear events from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('timingGatesEvents');
      localStorage.removeItem('timingGatesSessionId');
    }
  }

  
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


  const updateEvents = (newEvent: TimingEvent) => {
    setEvents(prev => {
      const updatedEvents = [newEvent, ...prev]; // Keep last 50 events
      if (typeof window !== 'undefined') {
        localStorage.setItem('timingGatesEvents', JSON.stringify(updatedEvents));
      }
      return updatedEvents;
    });
  }


  // Manual trigger function
  const handleManualTrigger = () => {
    const timestamp = Date.now(); // Convert to microseconds for consistency
    let timeDiff = 0;
    if (events.length > 0) {
      timeDiff = timestamp - events[0].timestamp
    }
    
    // Log the manual trigger event (event: 3, senderAlias: "Manual Trigger")
    updateEvents({
      sessionId: currentSessionId,
      timestamp,
      timeDiff, // No time difference for manual triggers
      macAddress: '-',
      senderAlias: 'Manual Trigger',
      speed: 0 // Speed is unknown for manual triggers
    });
  };

  // Update sender distance
  const updateSenderDistance = (senderId: number, distance: number) => {
    setSenders(prevSenders =>
      prevSenders.map((sender, index) =>
        index === senderId ? { ...sender, distanceToNext: distance } : sender
      )
    );
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


  // Update sender alias
  const updateSenderAlias = useCallback((senderId: number, newAlias: string) => {
    setSenders(prev => prev.map((sender, index) =>
      index === senderId ? { ...sender, alias: newAlias } : sender
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
          distanceToPrevious: 1,
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
    updateEvents({
      sessionId: currentSessionId,
      timestamp,
      timeDiff,
      macAddress,
      senderAlias: senders.find(s => s.macAddress === macAddress)?.alias || 'Unknown',
      speed: speed
    });
    
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
      <ToastProvider />
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Left Column (Main Stats) */}
          <div className="2xl:col-span-3 lg:col-span-4 flex flex-col gap-6 order-1 lg:order-1">
            <SenderList
              senders={senders}
              onUpdateAlias={updateSenderAlias}
              onUpdateDistance={updateSenderDistance}
              serialStatus={serialStatus}
              onDisconnectSerial={disconnectSerial}
              onConnectSerial={connectSerial}
            />
          </div>

          <div className="2xl:col-span-9 lg:col-span-8 flex flex-col h-full gap-6 order-2 lg:order-2">
            <EventsPane
              events={events}
              createNewSession={createNewSession}
              resetAll={resetAll}
              handleTrigger={handleManualTrigger}
            />
          </div>
        </div>
      </main>
    </div>
  );
};