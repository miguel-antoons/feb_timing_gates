import React from 'react';
import { Icon } from './Icon';
import { Lap, SessionStatus } from '../types';

interface TimerPanelProps {
  status: SessionStatus;
  currentTimeMs: number;
  currentSectorMs: number | null;
  lapNumber: number;
  lastLap: Lap | null;
  bestLap: Lap | null;
  sectorTimes?: number[]; // Times between gates
}

export const TimerPanel: React.FC<TimerPanelProps> = ({
  status,
  currentTimeMs,
  currentSectorMs,
  lapNumber,
  lastLap,
  bestLap
}) => {
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    // Calculate 10,000ths of a second (4 decimal places)
    const tenThousandths = Math.floor((ms % 1000) * 10);
    return {
      main: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      sub: `.${tenThousandths.toString().padStart(4, '0')}`
    };
  };

  const displayTime = formatTime(currentTimeMs);
  
  // Format sector times for display
  const formatSectorTime = (ms: number | undefined | null) => {
    if (ms === undefined || ms === null) return '--:--.----';
    return formatTime(ms).main + formatTime(ms).sub;
  };

  const getDeltaColor = (delta: number) => {
    if (delta === 0) return 'text-gray-400';
    return delta < 0 ? 'text-primary' : 'text-red-500';
  };

  const formatDelta = (delta: number) => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${(delta / 1000).toFixed(4)}`;
  };

  return (
    <div className="bg-surface-dark rounded-xl shadow-lg border border-primary/20 p-6 flex flex-col relative overflow-hidden h-[400px]">
      <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] opacity-10 pointer-events-none"></div>
      
      <div className="flex justify-between items-start relative z-10 mb-8">
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Current Session</span>
          <div className="flex items-center gap-2">
            <span className={`size-3 rounded-full ${status === SessionStatus.RUNNING ? 'bg-primary animate-pulse' : 'bg-red-500'}`}></span>
            <h2 className="text-white text-xl font-bold uppercase tracking-wider">
              {status === SessionStatus.RUNNING ? 'Lap In Progress' : 'Session Stopped'}
            </h2>
          </div>
        </div>
        <div className="bg-surface-border/50 border border-surface-border px-4 py-2 rounded-lg">
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block text-center">Lap Count</span>
          <span className="text-3xl font-mono font-bold text-white block text-center leading-none">{lapNumber}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center relative z-10">
        <div className={`font-mono font-bold tabular-nums leading-none tracking-tighter flex items-baseline drop-shadow-[0_0_30px_rgba(116,250,129,0.2)] transition-opacity duration-300 ${status === SessionStatus.IDLE && currentTimeMs === 0 ? 'opacity-50' : 'opacity-100'}`}>
          <span className="text-white text-[7rem] sm:text-[9rem]">{displayTime.main}</span>
          <span className="text-primary text-[4rem] sm:text-[5rem]">{displayTime.sub}</span>
        </div>

        {currentSectorMs && (
          <div className="absolute bottom-[-10px] bg-surface-border/90 px-4 py-2 rounded-lg border border-secondary/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 shadow-lg backdrop-blur-sm">
            <div className="p-1 rounded-full bg-secondary">
              <Icon name="timer" className="text-black text-xs" filled />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5">Sector 1 Time</span>
              <span className="text-white font-mono font-bold text-xl leading-none">
                {formatSectorTime(currentSectorMs)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10 mt-4">
        <div className="bg-[#0e1420] border border-surface-border rounded-lg p-3 flex justify-between items-center">
          <div>
            <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest block">Previous Lap</span>
            <span className="text-xl font-mono font-bold text-white block">
              {lastLap ? lastLap.formattedTime : '--:--.----'}
            </span>
          </div>
          {lastLap && (
            <div className={`text-lg font-bold font-mono ${getDeltaColor(lastLap.delta)}`}>
              {formatDelta(lastLap.delta)}
            </div>
          )}
        </div>
        <div className="bg-[#0e1420] border border-surface-border rounded-lg p-3 flex justify-between items-center">
          <div>
            <span className="text-primary text-[9px] font-bold uppercase tracking-widest block">Best Lap</span>
            <span className="text-xl font-mono font-bold text-white block">
              {bestLap ? bestLap.formattedTime : '--:--.----'}
            </span>
          </div>
          {bestLap && (
            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 border border-primary/30">
              <Icon name="emoji_events" className="text-primary text-sm" filled />
            </div>
          )}
        </div>
      </div>
      
      {/* Lap Speed Section */}
      {lastLap && lastLap.lapSpeed && (
        <div className="bg-[#0e1420] border border-surface-border rounded-lg p-3 flex justify-between items-center mt-3">
          <div>
            <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest block">Lap Speed</span>
            <span className="text-xl font-mono font-bold text-white block">
              {lastLap.lapSpeed} km/h
            </span>
          </div>
          <div className="flex items-center justify-center size-8 rounded-full bg-secondary/10 border border-secondary/30">
            <Icon name="speed" className="text-secondary text-sm" filled />
          </div>
        </div>
      )}
    </div>
  );
};