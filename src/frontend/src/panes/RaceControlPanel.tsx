import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { RaceStatus } from '@/src/types';

export const RaceControlPanel: React.FC = () => {
    const [status, setStatus] = useState<RaceStatus>(RaceStatus.GREEN);

    return (
        <div className="bg-surface-dark rounded-xl shadow-sm border border-surface-border p-5">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="size-2 bg-red-500 rounded-full animate-pulse"></span>
                Race Control Status
            </h3>
            <div className="flex justify-between gap-3">
                <ControlBtn 
                    active={status === RaceStatus.GREEN} 
                    onClick={() => setStatus(RaceStatus.GREEN)}
                    icon="flag" 
                    label="Green" 
                    colorClass="text-green-500" 
                    bgClass="bg-green-500" 
                    borderColorClass="border-green-500"
                />
                <ControlBtn 
                    active={status === RaceStatus.YELLOW} 
                    onClick={() => setStatus(RaceStatus.YELLOW)}
                    icon="warning" 
                    label="Yellow" 
                    colorClass="text-yellow-500" 
                    bgClass="bg-yellow-500" 
                    borderColorClass="border-yellow-500"
                />
                <ControlBtn 
                    active={status === RaceStatus.RED} 
                    onClick={() => setStatus(RaceStatus.RED)}
                    icon="block" 
                    label="Red" 
                    colorClass="text-red-500" 
                    bgClass="bg-red-600" 
                    borderColorClass="border-red-600"
                />
                 <ControlBtn 
                    active={status === RaceStatus.FINISH} 
                    onClick={() => setStatus(RaceStatus.FINISH)}
                    icon="sports_score" 
                    label="Finish" 
                    colorClass="text-gray-300" 
                    bgClass="bg-white" 
                    borderColorClass="border-white"
                />
            </div>
        </div>
    );
};

interface ControlBtnProps {
    active: boolean;
    onClick: () => void;
    icon: string;
    label: string;
    colorClass: string;
    bgClass: string;
    borderColorClass: string;
}

const ControlBtn: React.FC<ControlBtnProps> = ({ active, onClick, icon, label, colorClass, bgClass, borderColorClass }) => {
    return (
        <button 
            onClick={onClick}
            className={`
                flex-1 aspect-square rounded-lg flex flex-col items-center justify-center transition-all border
                ${active 
                    ? `${bgClass} text-black border-transparent shadow-[0_0_15px_rgba(0,0,0,0.3)]` 
                    : `bg-surface-border/50 ${colorClass} hover:${bgClass} hover:text-black border-transparent hover:${borderColorClass}`
                }
            `}
        >
            <Icon name={icon} className={`text-3xl ${active ? 'scale-110' : ''}`} filled={active} />
            <span className={`text-[10px] font-bold mt-2 uppercase ${active ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>
                {label}
            </span>
        </button>
    );
};