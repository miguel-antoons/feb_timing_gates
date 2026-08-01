import React from 'react';

export const ActiveSectorPanel: React.FC = () => {
    return (
        <div className="bg-surface-dark rounded-xl shadow-sm border border-surface-border p-5 flex flex-col relative overflow-hidden h-[200px] md:h-auto">
            <div className="flex justify-between items-start mb-2 z-10 relative">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">Active Sector</h3>
                <span className="text-[9px] font-bold bg-surface-border text-gray-300 px-1.5 py-0.5 rounded">ZOLDER</span>
            </div>
            <div className="absolute inset-0 top-8 flex items-center justify-center">
                <svg className="w-full h-full p-4 opacity-70" viewBox="0 0 300 230">
                     {/* Static Track - Base */}
                    <path 
                        d="M 40 140 L 100 140 Q 120 140 120 120 L 120 80 Q 120 60 140 60 L 220 60 Q 260 60 260 100 Q 260 140 220 140 L 180 140 Q 160 140 160 160 L 160 170 Q 160 190 140 190 L 40 190 Q 20 190 20 170 L 20 60 Q 20 40 40 40 L 80 40" 
                        fill="none" 
                        stroke="#1e2636" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="8"
                    />
                    {/* Animated Track - Overlay */}
                    <path 
                        className="race-car-path" 
                        d="M 40 140 L 100 140 Q 120 140 120 120 L 120 80 Q 120 60 140 60 L 220 60 Q 260 60 260 100 Q 260 140 220 140 L 180 140 Q 160 140 160 160 L 160 170 Q 160 190 140 190 L 40 190 Q 20 190 20 170 L 20 60 Q 20 40 40 40 L 80 40" 
                        fill="none" 
                        stroke="#74FA81" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2"
                    />
                    {/* Checkpoints */}
                    <circle cx="40" cy="140" r="3" fill="#00f0ff" />
                    <circle cx="80" cy="40" r="3" fill="#00f0ff" />
                </svg>
            </div>
        </div>
    );
};