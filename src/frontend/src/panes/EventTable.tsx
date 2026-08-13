import React from 'react';
import { TimingTable } from '../components/TimingTable';

interface Event {
  sessionId: number;
  timestamp: number;
  timeDiff: number;
  macAddress: string;
  senderAlias: string;
  speed?: number;
}

interface EventTableProps {
  events: Event[];
}

export const EventTable: React.FC<EventTableProps> = ({ events }) => {
  // Format timestamp as HH:MM:SS.mmm
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(Math.floor(timestamp / 1000));
    const ms = timestamp % 1000;
    return date.toISOString().substr(11, 8) + '.' + ms.toString().padStart(3, '0');
  };
  
  // Format time difference
  const formatTimeDiff = (timeDiff: number) => {
    if (timeDiff === 0) return '-'; // First event
    return (timeDiff / 1000000).toFixed(3) + 's';
  };
  
  // Get gate name
  const getGateName = (event: number, senderAlias: string) => {
    if (event === 0) return '--- Clear Marker ---';
    if (event === 3) return senderAlias; // Use senderAlias for manual triggers
    return event === 1 ? 'Gate 1' : event === 2 ? 'Gate 2' : 'Unknown';
  };
  
  return (
    <div className="bg-panel-dark rounded-lg p-4 shadow-lg flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 text-text-main">Gate Events</h2>
      <div className="flex-1 overflow-y-auto">
        <TimingTable events={events} />
      </div>
    </div>
  );
};