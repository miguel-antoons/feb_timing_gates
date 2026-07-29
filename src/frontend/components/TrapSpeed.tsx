import React from 'react';
import { Icon } from './Icon';

interface LapSpeedProps {
    lastSpeed: number | null;
    gateDistance: number;
    lapSpeed?: number | null;
}

export const LapSpeed: React.FC<LapSpeedProps> = ({ lastSpeed, gateDistance, lapSpeed }) => {
    return (
        <div className="bg-surface-dark rounded-xl shadow-sm border border-surface-border p-5 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex justify-between items-start">
                <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Icon name="speed" className="text-sm" />
                    Sector Speed ({gateDistance}m)
                </h3>
            </div>
            
            <div className="flex items-end gap-3 mt-2">
                <span className="text-5xl font-mono font-bold text-white tabular-nums tracking-tighter leading-none">
                    {lastSpeed !== null ? lastSpeed : '---'}
                </span>
                <span className="text-sm font-bold text-gray-500 mb-1">km/h</span>
            </div>
            
            <div className="w-full bg-surface-border h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-secondary to-white transition-all duration-500"
                    style={{ width: lastSpeed ? `${Math.min((lastSpeed / 200) * 100, 100)}%` : '0%' }}
                ></div>
            </div>
        </div>
    );
};