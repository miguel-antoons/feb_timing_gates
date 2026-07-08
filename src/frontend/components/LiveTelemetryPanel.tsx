import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { TelemetryData } from '../types';

export const LiveTelemetryPanel: React.FC = () => {
    const [data, setData] = useState<TelemetryData>({
        speed: 142,
        battery: 84,
        delta: -0.2
    });

    useEffect(() => {
        const interval = setInterval(() => {
            // Fluctuate values slightly to simulate live data
            setData(prev => ({
                speed: Math.max(0, Math.min(250, prev.speed + Math.floor(Math.random() * 5) - 2)),
                battery: prev.battery, // Battery drains slowly in real life, static for now
                delta: parseFloat((prev.delta + (Math.random() * 0.1 - 0.05)).toFixed(4))
            }));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const deltaColor = data.delta < 0 ? 'text-green-500' : 'text-red-500';

    return (
        <div className="bg-surface-dark rounded-xl shadow-sm border border-surface-border p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border/50">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Icon name="bolt" className="text-base text-secondary" filled />
                    Live Telemetry
                </h3>
                <div className="flex items-center gap-1.5 bg-green-900/30 px-2 py-0.5 rounded text-green-400 border border-green-900/50">
                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[9px] font-bold">LINK OK</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-border/30 rounded p-3 text-center border border-surface-border/50">
                    <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-tighter">{data.speed}</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase mt-1">km/h Speed</div>
                </div>
                <div className="bg-surface-border/30 rounded p-3 text-center border border-surface-border/50">
                    <div className="text-3xl font-mono font-bold text-primary tabular-nums tracking-tighter">{data.battery}<span className="text-sm text-gray-500">%</span></div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase mt-1">Battery</div>
                </div>
                <div className="bg-surface-border/30 rounded p-3 text-center border border-surface-border/50">
                    <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-tighter">{data.delta > 0 ? '+' : ''}{data.delta.toFixed(4)}</div>
                    <div className={`text-[9px] ${deltaColor} font-bold uppercase mt-1`}>Delta</div>
                </div>
            </div>
        </div>
    );
};