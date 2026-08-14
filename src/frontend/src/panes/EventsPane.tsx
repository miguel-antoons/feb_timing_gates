import React from 'react';
import { TimingTable } from '../components/TimingTable';
import { SessionControls } from '../components/SessionControls';
import { Clock } from '@gravity-ui/icons';

interface Event {
  sessionId: number;
  timestamp: number;
  timeDiff: number;
  macAddress: string;
  senderAlias: string;
  speed: number;
}

interface EventTableProps {
  events: Event[];
  createNewSession: () => void;
  resetAll: () => void;
  handleTrigger: () => void;
}

export const EventsPane: React.FC<EventTableProps> = ({ events, createNewSession, resetAll, handleTrigger }) => {

  const handleExport = () => {
    const headers = "SessionId,GateAlias,Timestamp_ms,TimeDiff_ms_,Speed_kmh,MacAddress\n";
    const rows = [...events].reverse().map(e =>
      `${e.sessionId},${e.senderAlias},${e.timestamp},${e.timeDiff},${e.speed},${e.macAddress}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FEB_events_${new Date().toISOString()}.csv`;
    a.click();
  }
  
  return (
    <div className="bg-panel-dark rounded-lg p-4 shadow-lg flex flex-col h-full">
      <div>
        <h2 className="text-xl font-bold mb-4 text-text-main flex items-center gap-2"><Clock className="size-5" />Timing Events</h2>
        <div className="mb-5">
          <SessionControls
            onExport={handleExport}
            onNewSession={createNewSession}
            onReset={resetAll}
            onManualTrigger={handleTrigger}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TimingTable events={events} />
      </div>
    </div>
  );
};