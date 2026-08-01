import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

export const GateIntervalPanel: React.FC = () => {
    // Simulate running timer with higher precision range (0-9999)
    const [ms, setMs] = useState(8924);
    const [sec, setSec] = useState(24);
    const [min, setMin] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setMs(prev => {
                if (prev >= 9900) {
                    setSec(s => {
                         if (s >= 59) {
                             setMin(m => m + 1);
                             return 0;
                         }
                         return s + 1;
                    });
                    return 0;
                }
                return prev + 137; // Random-ish increment scaled for 4 decimals
            });
        }, 10);
        return () => clearInterval(interval);
    }, []);

    const formattedTime = {
        min: min.toString().padStart(2, '0'),
        sec: sec.toString().padStart(2, '0'),
        ms: ms.toString().padStart(4, '0')
    };

    return (
        <div className="bg-surface-dark rounded-xl shadow-lg border border-primary/20 p-0 flex flex-col relative overflow-hidden min-h-[420px]">
            <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] opacity-10 pointer-events-none"></div>
            
            <div className="p-4 border-b border-surface-border flex justify-between items-center bg-gradient-to-r from-[#0e1420] to-primary-dark/20 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded border border-primary/30 flex items-center justify-center">
                        <Icon name="timer" className="text-primary animate-pulse text-lg" />
                    </div>
                    <h3 className="text-white font-bold uppercase tracking-wider text-sm">Gate-to-Gate Interval</h3>
                </div>
                <div className="flex gap-2">
                    <div className="bg-primary-dark text-white border border-primary/30 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary animate-ping"></span>
                        Live Tracking
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
                <p className="text-primary text-xs font-mono uppercase tracking-[0.3em] mb-4 bg-primary-dark/30 px-3 py-1 rounded border border-primary/10">Active Sector Time</p>
                <div className="relative z-10">
                    <h1 className="text-7xl sm:text-8xl lg:text-9xl font-mono font-bold tracking-tighter tabular-nums text-white leading-none drop-shadow-[0_0_30px_rgba(116,250,129,0.3)]">
                        {formattedTime.min}:{formattedTime.sec}<span className="text-primary">.{formattedTime.ms}</span>
                    </h1>
                </div>

                {/* Progress Bar Area */}
                <div className="w-full mt-12 mb-8 relative px-12">
                    {/* Background Bar */}
                    <div className="absolute top-1/2 left-0 w-full h-[6px] bg-surface-border rounded-full -translate-y-1/2 z-0"></div>
                    {/* Active Bar */}
                    <div className="absolute top-1/2 left-0 h-[6px] bg-gradient-to-r from-primary-dark via-primary to-white -translate-y-1/2 z-0 rounded-full shadow-[0_0_15px_rgba(116,250,129,0.5)]" style={{ width: '72%' }}></div>
                    
                    <div className="flex justify-between relative z-10 w-full">
                        {/* Gate A */}
                        <div className="flex flex-col items-center gap-3 -translate-x-1/2">
                            <div className="size-6 rounded-full bg-primary-dark border-2 border-primary shadow-[0_0_15px_rgba(116,250,129,0.8)] flex items-center justify-center">
                                <div className="size-2 bg-white rounded-full"></div>
                            </div>
                            <div className="bg-surface-dark/90 px-3 py-1.5 rounded border border-surface-border backdrop-blur-sm text-center">
                                <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">Gate A</span>
                                <span className="text-[10px] font-mono text-gray-400 block">14:41:05.1000</span>
                            </div>
                        </div>

                        {/* Driver Position Indicator */}
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 z-20" style={{ left: '72%' }}>
                            <div className="relative">
                            <img 
                            alt="FEB Logo" 
                            className="w-12 h-full object-contain bg-primary-dark rounded-full" 
                            src="https://formulaelectric.be/wp-content/uploads/2024/09/FEB-Icon_Green_Smaller-1024x847.png" 
                        />
                                {/*<div className="absolute -inset-2 bg-primary/30 rounded-full animate-ping"></div>
                                <div className="size-5 bg-white rounded-full shadow-[0_0_20px_white] border-4 border-primary"></div> */}
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-black text-[12px] font-black px-2 py-1 rounded skew-x-[-10deg] shadow-lg whitespace-nowrap">
                                    Predicted timing
                                </div>
                            </div>
                        </div>

                        {/* Gate B */}
                        <div className="flex flex-col items-center gap-3 translate-x-1/2">
                            <div className="size-6 rounded-full bg-surface-border border-2 border-gray-600 flex items-center justify-center">
                                <div className="size-2 bg-gray-500 rounded-full"></div>
                            </div>
                            <div className="bg-surface-dark/90 px-3 py-1.5 rounded border border-surface-border backdrop-blur-sm text-center opacity-60">
                                <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">Gate B</span>
                                <span className="text-[10px] font-mono text-gray-600 block">--:--:--.----</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cameras */}
                <div className="w-full grid grid-cols-2 gap-4 mt-2">
                    <div className="relative rounded-lg overflow-hidden border border-surface-border group bg-black">
                        <img 
                            alt="Start Gate Camera" 
                            className="w-full h-72 object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuASeDhRheciKfRWAk0AvpZatRO7lkGLVrJFDHofGCLfEwBlQJk7RQwR1SUAJAy2ZevZt01w9Q79vGGln-AxSt0m-1wxEHsUIXj3Otw18Z1P2yGEFxY0xTWN5ORqyXpx2Mpc0pc-0T55_CrlHNX3DikNWOOj78TA2_8BVLndKZ94DGOLVjoDylZtNfhtU7TXB0rABMMzVNB0ydXt0xvcFKRjfkgaRS1k7YhV0H-2fSwmMj0jTpYfwYtgAtivyL2soDvsv-7sWA1-S5Y" 
                        />
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded flex items-center gap-1.5">
                            <span className="size-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">CAM 01 • Start</span>
                        </div>
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 transition-colors pointer-events-none rounded-lg"></div>
                         {/* Crosshair Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                            <div className="w-8 h-[1px] bg-white"></div>
                            <div className="h-8 w-[1px] bg-white absolute"></div>
                        </div>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border border-surface-border group bg-black">
                        <img 
                            alt="Finish Gate Camera" 
                            className="w-full h-72 object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9XXGFnwTx2k1TyjYUEVNYbRa--bAc9TVfv7YLM4ExObJCpDxx4bRX-nmvLXWrVBdCcZfm5H-Qdy-fXdwmkxdXrgGN1Y3qUzs5X3Hdm4yJUgSdi5iDvaCig1oF2YDIQqD4FOwjWD8mSXnSe2I2KKD_f74ThrK9w7WAk19XgJwvd_uNLvP-C_ywowETZWUkv8ucVKsA7PpXnUS5dQqtqzAAXbaPUr3FF2I6JSpSlFlg3qdQ0PYGPakiStuSQlT80hNtLzkyypzjwiI" 
                        />
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded flex items-center gap-1.5">
                            <span className="size-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">CAM 02 • Finish</span>
                        </div>
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 transition-colors pointer-events-none rounded-lg"></div>
                        {/* Crosshair Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                            <div className="w-8 h-[1px] bg-white"></div>
                            <div className="h-8 w-[1px] bg-white absolute"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 border-t border-surface-border bg-[#0e1420]">
                <button className="flex items-center justify-center gap-3 p-4 hover:bg-white/5 transition-colors border-r border-surface-border group/btn">
                    <Icon name="flag" className="text-gray-400 group-hover/btn:text-white transition-colors" />
                    <span className="text-xs font-bold text-gray-400 group-hover/btn:text-white uppercase tracking-wider">Manual Gate Trigger</span>
                </button>
                <button className="flex items-center justify-center gap-3 p-4 bg-primary-dark/30 hover:bg-primary-dark/50 transition-colors group/btn border-t border-primary/30 sm:border-t-0">
                    <Icon name="check_circle" className="text-primary group-hover/btn:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Confirm Finish</span>
                </button>
            </div>
        </div>
    );
};