import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-surface-border bg-surface-dark/90 backdrop-blur-md px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 p-1.5 rounded bg-primary-dark flex items-center justify-center shadow-[0_0_15px_rgba(8,76,62,0.6)] border border-primary/20 overflow-hidden">
            <img
              alt="FEB Logo"
              className="w-full h-full object-contain"
              src="https://formulaelectric.be/wp-content/uploads/2024/09/FEB-Icon_Green_Smaller-1024x847.png"
            />
          </div>
          <div className="h-8 w-[1px] bg-surface-border"></div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm tracking-wide leading-none">FORMULA E BELGIUM</span>
            <span className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase leading-none mt-1">Official Timing</span>
          </div>
          <div className="h-10 w-48 ml-3 p-1.5 roundeditems-center justify-center overflow-hidden">
            <img
              alt="TMC Logo"
              className="w-full h-full object-contain"
              src="https://hightechcampus.com/storage/5847/TMC-logo-2022-blue_RGB.png"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-center">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Local Time</p>
          <p className="text-xl font-bold tabular-nums text-white font-mono leading-none">
            {formatTime(time)}
          </p>
        </div>
        <div className="h-8 w-[1px] bg-surface-border hidden sm:block"></div>
        <button className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-surface-border hover:bg-primary-dark hover:text-white transition-colors text-gray-400">
          <Icon name="settings" className="text-[20px]" />
        </button>
      </div>
    </header>
  );
};