import React from 'react';
import { Icon } from '../components/Icon';
import { SessionStatus } from '../types';

interface SerialPortStatus {
    isConnected: boolean;
    isAvailable: boolean;
    portName: string | null;
    error: string | null;
}

interface SessionControlsProps {
    status: SessionStatus;
    onStopReset: () => void;
    onExport: () => void;
    onExportEvents: () => void;
    onManualTrigger: () => void;
    onSoftReset: () => void;
    // Serial port props
    serialStatus?: SerialPortStatus;
    onConnectSerial?: () => Promise<void>;
    onDisconnectSerial?: () => Promise<void>;
    onIdentifySender?: (macAddress: string) => void;
    selectedSender: string | null;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
    status, 
    onStopReset,
    onExportEvents,
    onManualTrigger,
    onSoftReset,
    serialStatus,
    onConnectSerial,
    onDisconnectSerial,
    onIdentifySender = undefined,
    selectedSender = null
}) => {
    const isRunning = status === SessionStatus.RUNNING;

    return (
        <div className="bg-surface-dark rounded-xl shadow-sm border border-surface-border p-5 flex flex-col gap-4 h-auto">
            
            <div className="flex items-center justify-between mb-0">
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <Icon name="sports_score" className="text-xs" />
                    Track Control
                </h3>
                <div className="flex items-center gap-2">
                    {serialStatus && (
                        <button
                            onClick={serialStatus.isConnected ? onDisconnectSerial : onConnectSerial}
                            disabled={!serialStatus.isAvailable && !serialStatus.isConnected}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                serialStatus.isConnected
                                    ? 'bg-primary-dark text-primary border border-primary/30'
                                    : 'bg-surface-border hover:bg-surface-border/80 text-gray-300 border-surface-border'
                            }`}
                            title={!serialStatus.isAvailable ? 'Serial API not available in this browser' : ''}
                        >
                            <Icon name="settings_input_component" className="text-xs" />
                            <span>{serialStatus.isConnected ? 'Connected' : 'Connect'}</span>
                        </button>
                    )}
                </div>
            </div>



            <div className="grid grid-cols-1 gap-3">
                {/* Manual Trigger Button */}
                <button 
                    onClick={onManualTrigger}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all border font-bold uppercase text-[10px] tracking-wider bg-yellow-600 hover:bg-yellow-500 text-black border-yellow-505/50 shadow-lg`}
                >
                    <Icon name="touch_app" className="text-lg" filled={true} />
                    Manual Trigger
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Stop / Reset Button */}
                <button 
                    onClick={onStopReset}
                    className={
                        `flex items-center justify-center gap-2 p-3 rounded-lg transition-all border font-bold uppercase text-[10px] tracking-wider
                        ${isRunning 
                            ? 'bg-red-600 hover:bg-red-500 text-white border-red-500/50 shadow-lg' 
                            : 'bg-surface-border hover:bg-surface-border/80 text-gray-300 border-gray-600'}
                    `}
                >
                    <Icon name={isRunning ? "stop" : "restart_alt"} className="text-lg" filled={isRunning} />
                    {isRunning ? "Stop Session" : "Reset All"}
                </button>

                <button 
                    onClick={onSoftReset}
                    className="flex items-center justify-center gap-2 p-3 bg-surface-border hover:bg-surface-border/80 text-orange-400 rounded-lg transition-all border border-surface-border font-bold uppercase text-[10px] tracking-wider"
                >
                    <Icon name="restart_alt" className="text-lg" />
                    Soft Reset
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <button 
                    onClick={onExportEvents}
                    className="flex items-center justify-center gap-2 p-3 bg-surface-border hover:bg-surface-border/80 text-blue-400 rounded-lg transition-all border border-surface-border font-bold uppercase text-[10px] tracking-wider"
                >
                    <Icon name="download" className="text-lg" />
                    Export Events CSV
                </button>
            </div>
            
            {/* Identify Sender button - hidden for now as requested */}
            <div className="hidden">
                {selectedSender && onIdentifySender && (
                    <button
                        onClick={() => onIdentifySender(selectedSender)}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-surface-border hover:bg-surface-border/80 text-yellow-400 rounded-lg transition-all border border-surface-border font-bold uppercase text-[10px] tracking-wider mt-2"
                    >
                        <Icon name="search" className="text-lg" />
                        Identify Sender
                    </button>
                )}
            </div>
        </div>
    );
};