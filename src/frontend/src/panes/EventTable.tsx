import React from 'react';

interface Event {
  timestamp: number;
  timeDiff: number;
  event: number;
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
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-panel-dark">
            <tr>
              <th className="text-left p-2 text-text-secondary">Time</th>
              <th className="text-left p-2 text-text-secondary">Gate</th>
              <th className="text-left p-2 text-text-secondary">ΔTime</th>
              <th className="text-left p-2 text-text-secondary">Speed</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-text-secondary">
                  No events received yet
                </td>
              </tr>
            ) : (
              events.map((event, index) => (
                <tr key={index} className={`border-t border-background-dark ${event.event === 0 ? 'bg-yellow-900/20' : ''}`}>
                  <td className="p-2">{formatTimestamp(event.timestamp)}</td>
                  <td className="p-2">{getGateName(event.event, event.senderAlias)}</td>
                  <td className="p-2">{event.event === 0 ? '-' : formatTimeDiff(event.timeDiff)}</td>
                  <td className="p-2">{event.event === 0 || event.event === 3 ? '-' : (event.speed ? `${event.speed.toFixed(1)} km/h` : '-')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};