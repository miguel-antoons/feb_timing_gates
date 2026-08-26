import React from 'react';
import { TimingTable } from '../components/TimingTable';
import { SessionControls } from '../components/SessionControls';
import { Clock } from '@gravity-ui/icons';
import { TimingEvent } from '../types';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

interface EventTableProps {
  events: TimingEvent[];
  createNewSession: () => void;
  resetAll: () => void;
  handleTrigger: () => void;
}

export const EventsPane: React.FC<EventTableProps> = ({ events, createNewSession, resetAll, handleTrigger }) => {

  const handleExport = async () => {
    const headers = "SessionId,GateAlias,Timestamp_ms,TimeDiff_ms_,Speed_kmh,MacAddress\n";
    const rows = [...events].reverse().map(e =>
      `${e.sessionId},${e.senderAlias},${e.timestamp},${e.timeDiff},${e.speed},${e.macAddress}`
    ).join("\n");
    
    const csvContent = headers + rows;
  
    try {
      // 1. Open a "Save As" dialog
      const filePath = await save({
        filters: [{
          name: 'CSV File',
          extensions: ['csv']
        }],
        defaultPath: `FEB_events_${new Date().toISOString().replace(/:/g, '-')}.csv` 
      });
  
      if (filePath) {
        await writeTextFile(filePath, csvContent);
        console.log("File saved successfully to:", filePath);
      }
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  };
  
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