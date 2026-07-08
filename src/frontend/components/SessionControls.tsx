import React from 'react';
import { Icon } from './Icon';
import { SessionStatus } from '../types';

interface SessionControlsProps {
    status: SessionStatus;
    gateDistance: number;
    onGate1: () => void;
    onGate2: () => void;
    onStopReset: () => void;
    onExport: () => void;
    onGateDistanceChange: (dist: number) => void;
}

export const SessionControls: React.FC<SessionControlsProps> = ({ 
    status, 
    gateDistance, 
    onGate1,
    onGate2,
    onStopReset,
    onExport, 
    onGateDistanceChange 
}) => {
    const isRunning = status === SessionStatus.RUNNING;

    return (
        <div className="bg-surface-dark rounded-xl shadow-sm border border-surface-border p-5 flex flex-col gap-5 h-auto">
            
            <div className="flex items-center justify-between mb-0">
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <Icon name="sports_score" className="text-xs" />
                    Track Control
                </h3>
                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Dist.</label>
                    <div className="flex items-center bg-surface-border/50 rounded border border-surface-border px-2 py-0.5 hover:border-primary/50 transition-colors">
                        <input 
                            type="number" 
                            value={gateDistance} 
                            onChange={e => onGateDistanceChange(Math.max(1, Number(e.target.value)))}
                            className="bg-transparent border-none text-white text-xs font-mono w-10 focus:ring-0 p-0 text-right font-bold"
                        />
                        <span className="text-gray-500 text-[10px] font-bold pl-1">m</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1">
                {/* Gate 1: Primary Action (Start / Lap) */}
                <button 
                    onClick={onGate1}
                    className="flex flex-col items-center justify-center p-4 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(22,163,74,0.3)] border border-green-400/30 group active:scale-[0.98]"
                >
                    <Icon name={isRunning ? "flag" : "play_arrow"} className="text-3xl mb-1 group-hover:scale-110 transition-transform" filled />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {isRunning ? "Gate 1 (Lap)" : "Gate 1 (Start)"}
                    </span>
                </button>

                {/* Gate 2: Secondary Action (Trap) */}
                <button 
                    onClick={onGate2}
                    disabled={!isRunning}
                    className={`
                        flex flex-col items-center justify-center p-4 rounded-lg transition-all border group active:scale-[0.98]
                        ${isRunning 
                            ? 'bg-secondary/20 hover:bg-secondary/30 text-secondary border-secondary/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
                            : 'bg-surface-border/30 text-gray-500 border-surface-border cursor-not-allowed opacity-50'}
                    `}
                >
                    <Icon name="speed" className="text-3xl mb-1 group-hover:scale-110 transition-transform" filled={isRunning} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Gate 2 (Trap)</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                 {/* Stop / Reset Button */}
                 <button 
                    onClick={onStopReset}
                    className={`
                        flex items-center justify-center gap-2 p-3 rounded-lg transition-all border font-bold uppercase text-[10px] tracking-wider
                        ${isRunning 
                            ? 'bg-red-600 hover:bg-red-500 text-white border-red-500/50 shadow-lg' 
                            : 'bg-surface-border hover:bg-surface-border/80 text-gray-300 border-gray-600'}
                    `}
                >
                    <Icon name={isRunning ? "stop" : "restart_alt"} className="text-lg" filled={isRunning} />
                    {isRunning ? "Stop Session" : "Reset All"}
                </button>

                <button 
                    onClick={onExport}
                    className="flex items-center justify-center gap-2 p-3 bg-surface-border hover:bg-surface-border/80 text-blue-400 rounded-lg transition-all border border-surface-border font-bold uppercase text-[10px] tracking-wider"
                >
                    <Icon name="download" className="text-lg" />
                    Export CSV
                </button>
            </div>
        </div>
    );
};