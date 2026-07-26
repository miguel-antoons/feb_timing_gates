import React from 'react';
import { Icon } from './Icon';
import { Lap } from '../types';

interface LapTableProps {
    laps: Lap[];
    gateDistance: number;
}

export const LapTable: React.FC<LapTableProps> = ({ laps, gateDistance }) => {
    // Reverse laps to show newest first
    const displayLaps = [...laps].reverse();

    return (
        <div className="bg-surface-dark rounded-xl shadow-lg border border-surface-border flex flex-col flex-1 overflow-hidden h-full min-h-[400px]">
            <div className="p-5 border-b border-surface-border flex justify-between items-center bg-[#0e1420]">
                <div className="flex items-center gap-2">
                    <Icon name="history" className="text-primary text-xl" />
                    <h3 className="text-white text-base font-bold uppercase tracking-wide">Session History</h3>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">
                    Total: <span className="text-white">{laps.length}</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0b101a] sticky top-0 z-10 shadow-sm text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-surface-border">
                        <tr>
                            <th className="p-3 pl-5 text-center w-16">Lap</th>
                            <th className="p-3 text-left hidden md:table-cell">Sender</th>
                            <th className="p-3 text-right">Time</th>
                            <th className="p-3 text-right hidden sm:table-cell">S1 ({gateDistance}m)</th>
                            <th className="p-3 text-right hidden sm:table-cell">Trap</th>
                            <th className="p-3 pr-5 text-right">Delta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-sm">
                        {displayLaps.map((lap) => {
                            const isBest = lap.isBest;
                            
                            return (
                                <tr 
                                    key={lap.number} 
                                    className={`
                                        transition-colors border-l-2 
                                        ${isBest 
                                            ? 'bg-primary-dark/10 hover:bg-primary-dark/20 border-l-primary' 
                                            : 'hover:bg-white/5 border-l-transparent'
                                        }
                                    `}
                                >
                                    <td className="p-3 pl-5 text-center">
                                        <span className={`font-mono font-bold ${isBest ? 'text-primary' : 'text-gray-400'}`}>
                                            {lap.number}
                                        </span>
                                    </td>
                                    <td className="p-3 text-left hidden md:table-cell">
                                        <span className="font-mono text-gray-400 text-xs">
                                            {lap.senderId || '-'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className={`font-mono font-bold tabular-nums text-lg ${isBest ? 'text-white' : 'text-gray-200'}`}>
                                            {lap.formattedTime}
                                        </div>
                                    </td>
                                    <td className="p-3 text-right hidden sm:table-cell">
                                        <span className="font-mono text-gray-400 tabular-nums">{lap.sector1 || '-'}</span>
                                    </td>
                                    <td className="p-3 text-right hidden sm:table-cell">
                                        <span className="font-mono text-gray-400 tabular-nums">
                                            {lap.speed ? `${lap.speed} km/h` : '-'}
                                        </span>
                                    </td>
                                    <td className="p-3 pr-5 text-right">
                                         <span className={`font-mono font-bold text-xs tabular-nums px-2 py-0.5 rounded ${
                                            lap.delta === 0 ? 'bg-gray-800 text-gray-400' :
                                            lap.delta < 0 ? 'bg-primary/10 text-primary' : 'bg-red-900/20 text-red-400'
                                         }`}>
                                            {lap.delta > 0 ? '+' : ''}{(lap.delta / 1000).toFixed(4)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {laps.length === 0 && (
                             <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 text-xs uppercase tracking-widest">
                                    No laps recorded
                                </td>
                             </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};