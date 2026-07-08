import React from 'react';
import { Icon } from './Icon';
import { Driver } from '../types';

const MOCK_DRIVERS: Driver[] = [
    { id: '1', position: 1, name: 'J. VERGNE', team: 'DS PENSKE', time: '1:12.400', gap: '-' },
    { id: '2', position: 2, name: 'S. VANDOORNE', team: 'DS PENSKE', time: '1:12.600', gap: '+0.200' },
    { id: '3', position: 3, name: 'M. EVANS', team: 'JAGUAR', time: '1:12.850', gap: '+0.450' },
    { id: '4', position: 4, name: 'P. WEHRLEIN', team: 'PORSCHE', time: '1:13.012', gap: '+0.612' },
    { id: '5', position: 6, name: 'N. CASSIDY', team: 'ON FLYING LAP', time: '--:--.---', gap: 'S1', status: 'flying' },
];

export const LiveStandingsPanel: React.FC = () => {
    return (
        <div className="bg-surface-dark rounded-xl shadow-lg border border-surface-border flex flex-col flex-1 overflow-hidden min-h-[500px]">
            <div className="p-5 border-b border-surface-border flex justify-between items-center bg-[#0e1420]">
                <div className="flex items-center gap-2">
                    <Icon name="leaderboard" className="text-primary text-xl" />
                    <h3 className="text-white text-base font-bold uppercase tracking-wide">Live Standings</h3>
                </div>
                <span className="text-[10px] font-bold bg-primary text-black px-2 py-1 rounded shadow-neon-sm">Q1</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0b101a] sticky top-0 z-10 shadow-sm text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-surface-border">
                        <tr>
                            <th className="p-3 font-bold pl-5">Pos</th>
                            <th className="p-3 font-bold">Driver</th>
                            <th className="p-3 font-bold text-right">Time</th>
                            <th className="p-3 font-bold text-right pr-5">Gap</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-sm">
                        {MOCK_DRIVERS.map((driver) => {
                            const isLeader = driver.position === 1;
                            const isFlying = driver.status === 'flying';
                            
                            return (
                                <tr 
                                    key={driver.id} 
                                    className={`
                                        transition-colors border-l-2 
                                        ${isLeader 
                                            ? 'bg-primary-dark/10 hover:bg-primary-dark/20 border-l-primary' 
                                            : isFlying
                                                ? 'bg-secondary/5 border-l-secondary/50'
                                                : 'hover:bg-white/5 border-l-transparent'
                                        }
                                    `}
                                >
                                    <td className="p-3 pl-5">
                                        {isLeader ? (
                                            <div className="size-6 bg-primary text-black rounded flex items-center justify-center text-xs font-bold shadow-neon-sm">{driver.position}</div>
                                        ) : (
                                            <span className="text-gray-400 font-bold text-sm pl-2">{driver.position}</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div className={`font-bold ${isLeader ? 'text-white' : 'text-gray-200'}`}>{driver.name}</div>
                                        {isFlying ? (
                                             <div className="text-[9px] text-secondary font-bold mt-1 animate-pulse">ON FLYING LAP</div>
                                        ) : (
                                            <div className={`text-[9px] ${isLeader ? 'text-primary' : 'text-gray-500'}`}>{driver.team}</div>
                                        )}
                                    </td>
                                    <td className={`p-3 text-right font-mono font-medium tabular-nums ${isLeader ? 'text-primary font-bold' : isFlying ? 'text-secondary italic' : 'text-gray-300'}`}>
                                        {driver.time}
                                    </td>
                                    <td className={`p-3 text-right text-xs font-bold tabular-nums font-mono pr-5 ${driver.gap === '-' ? 'text-gray-500' : isFlying ? 'text-gray-500' : 'text-red-400'}`}>
                                        {driver.gap}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-surface-border bg-[#0e1420] flex justify-center">
                <button className="text-xs font-bold text-primary hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wide">
                     Export Session Data
                    <Icon name="download" className="text-sm" />
                </button>
            </div>
        </div>
    );
};