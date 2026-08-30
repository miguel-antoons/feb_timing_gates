import { useSerialPort } from '@/src/hooks/useSerialPort';
import { LatestEvents, MessageType, Sender, TimingEvent } from '@/src/types';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { SenderList } from '../panes/SenderPane';
import { EventsPane } from '../panes/EventsPane';
import { generateDefaultAlias } from '../utils/senders';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import { CircleCheck, CircleXmark } from '@gravity-ui/icons';
import { ERRORS } from '../utils/errors';


export const TimingGates: React.FC = () => {
  // --- State ---
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSessionId = localStorage.getItem('timingGatesSessionId');
      return savedSessionId ? parseInt(savedSessionId, 10) : 1;
    }
    return 1;
  });

  const [senders, setSenders] = useState<Sender[]>([]);
  const [events, setEvents] = useState<TimingEvent[]>(() => {
    // Load events from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem('timingGatesEvents');
      return savedEvents ? JSON.parse(savedEvents) : [];
    }
    return [];
  });
  const [latestEvents, setLatestEvents] = useState<LatestEvents>({});
  const sendersRef = useRef(senders);
  const latestEventsRef = useRef(latestEvents);
  const sessionIdRef = useRef(currentSessionId);

  useEffect(() => { sendersRef.current = senders; }, [senders]);
  useEffect(() => { latestEventsRef.current = latestEvents; }, [latestEvents]);
  useEffect(() => { sessionIdRef.current = currentSessionId; }, [currentSessionId]);

  // --- Serial Port Connection ---
  const serialBaudRate = 115200;

  
  const createNewSession = () => {
    const newSessionId = currentSessionId + 1;
    setCurrentSessionId(newSessionId);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('timingGatesSessionId', JSON.stringify(newSessionId));
    }
    
    toast(`New session ${newSessionId} created.`, {
      icon: <CircleCheck />,
      cancel: {
        label: 'Close',
        onClick: () => console.log('Closed Toast!'),
      },
      classNames: {
        toast: "!bg-surface-new !text-primary !border-surface-new !rounded-large",
        cancelButton: "!text-primary !border !border-primary !rounded-large",
      },
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


  const updateEvents = (newEvent: TimingEvent) => {
    setEvents(prev => {
      const updatedEvents = [...prev, newEvent].sort((a, b) => b.timestamp - a.timestamp);
      if (typeof window !== 'undefined') {
        localStorage.setItem('timingGatesEvents', JSON.stringify(updatedEvents));
      }
      return updatedEvents;
    });
  }


  // Manual trigger function
  const handleManualTrigger = () => {    
    // Log the manual trigger event (event: 3, senderAlias: "Manual Trigger")
    updateEvents({
      sessionId: currentSessionId,
      timestamp: Date.now(),
      macAddress: '-',
      senderAlias: 'Manual Trigger',
      distanceToPrevious: 0,
    });
  };

  // Update sender distance
  const updateSenderDistance = (senderId: number, distance: number) => {
    setSenders(prevSenders =>
      prevSenders.map((sender, index) =>
        index === senderId ? { ...sender, distanceToPrevious: distance } : sender
      )
    );
  };

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
    if (event.message_type in ERRORS) {
      console.error(`Error from receiver: ${ERRORS[event.message_type as MessageType]}`);
      toast.error(ERRORS[event.message_type as MessageType], {
        icon: <CircleXmark />,
        cancel: {
          label: 'Close',
          onClick: () => console.log('Closed Toast!'),
        },
        classNames: {
          toast: "!bg-surface-new !text-red-500 !border-surface-new !rounded-large",
          cancelButton: "!text-red-500 !border !border-red-500 !rounded-large",
        },
      });
    }
    // Only process BEAM_EVENT messages
    if (event.message_type !== MessageType.BEAM_EVENT) return;
    
    const timestamp = event.gps_s * 1000 + Math.floor(event.gps_us / 1000);
    const macAddress = event.mac_address;

    const currentSenders = sendersRef.current;

    const existingSender = currentSenders.find(sender => sender.macAddress === macAddress);

    if (!existingSender) {
      // Sender is unknown. Add them to the state.
      setSenders(prev => [...prev, {
        macAddress,
        alias: generateDefaultAlias(macAddress),
        distanceToPrevious: 1, // Default distance
      }]);

      setLatestEvents(prev => ({
        ...prev,
        [macAddress]: event.event,
      }));

      return;
    }

    const latestEventForSender = latestEventsRef.current[macAddress];
    if (latestEventForSender >= event.event) {
      // Duplicate event for the same sender. Ignore it.
      console.warn(`Duplicate event for sender ${macAddress}. Ignoring.`);
      return;
    }

    setLatestEvents(prev => ({
      ...prev,
      [macAddress]: event.event,
    }));
      
    updateEvents({
      sessionId: sessionIdRef.current,
      timestamp,
      macAddress,
      senderAlias: existingSender.alias,
      distanceToPrevious: existingSender.distanceToPrevious,
    });
  }, [updateEvents]);

  const {
    status: serialStatus,
    connect: connectSerial,
    disconnect: disconnectSerial,
    requestReceiverMac,
    sendMessage
  } = useSerialPort(handleSerialEvent, serialBaudRate);

  // Request receiver's MAC address when connected
  useEffect(() => {
    if (serialStatus.isConnected) {
      requestReceiverMac();
    }
  }, [serialStatus.isConnected, requestReceiverMac]);

  return (
    <div className="bg-background-dark text-text-main font-display overflow-x-hidden min-h-screen flex flex-col selection:bg-primary selection:text-black">
      <Toaster position="bottom-center" />
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
              sendSerialMessage={sendMessage}
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
