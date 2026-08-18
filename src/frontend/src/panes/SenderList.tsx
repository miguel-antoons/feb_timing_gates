import React, { useState, useRef } from 'react';
import { Sender } from '../types';
import { SenderElement } from '../components/SenderElement';
import { DragDropProvider } from '@dnd-kit/react';
import {move} from '@dnd-kit/helpers';
import { Eye, Sliders } from '@gravity-ui/icons';

interface SerialPortStatus {
  isConnected: boolean;
  isAvailable: boolean;
  portName: string | null;
  error: string | null;
}


interface SenderListProps {
  senders: Sender[];
  onUpdateAlias: (senderId: number, newAlias: string) => void;
  onUpdateDistance: (senderId: number, distance: number) => void;
  serialStatus: SerialPortStatus;
  onDisconnectSerial: () => void;
  onConnectSerial: () => void;
}

export const SenderList: React.FC<SenderListProps> = (
  { senders, onUpdateAlias, onUpdateDistance, serialStatus, onDisconnectSerial, onConnectSerial }
) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [gateOrder, setGateOrder] = useState(createRange(senders.length));

  return (
    <div className="bg-panel-dark rounded-lg p-4 shadow-lg max-w-108">
      <div className="flex items-center justify-between mb-0">
        <h2 className="text-xl font-bold mb-4 text-text-main flex items-center gap-2"><Eye className="size-5" />Gates</h2>
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
              <Sliders />
              <span>{serialStatus.isConnected ? 'Connected' : 'Connect'}</span>
            </button>
          )}
      </div>
      </div>
      <DragDropProvider
        onDragEnd={(event) => {
          setGateOrder((gateOrder) => move(gateOrder, event));
        }}
      >
        <div className="space-y-2 max-h-[600px]" ref={containerRef}>
        {senders.length === 0 ? (
          <p className="text-text-secondary text-center py-4">No senders detected</p>
        ) : (
            gateOrder.map((id, index) => (
              <SenderElement
                id={id}
                index={index}
                key={id}
                onUpdateAlias={onUpdateAlias}
                onUpdateDistance={onUpdateDistance}
                sender={senders[id]}
              />
              )
            )
          )}
        </div>
      </DragDropProvider>
    </div>
  );
};

function createRange(length: number) {
  let res = [];
  for (let i = 0; i < length + 1; i++) {
    res.push(i);
  }
  return res;
}