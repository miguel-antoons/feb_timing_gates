import React, { useState, useRef } from 'react';
import { Sender } from '../types';
import { SenderElement } from '../components/SenderElement';
import { DragDropProvider } from '@dnd-kit/react';
import {move} from '@dnd-kit/helpers';

interface SenderListProps {
  senders: Sender[];
  onUpdateAlias: (senderId: number, newAlias: string) => void;
  onUpdateDistance: (senderId: number, distance: number) => void;
  onReorder: (newOrder: Sender[]) => void;
}

export const SenderList: React.FC<SenderListProps> = (
  { senders, onUpdateAlias, onUpdateDistance, onReorder }
) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [gateOrder, setGateOrder] = useState(createRange(senders.length));

  return (
    <div className="bg-panel-dark rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-text-main">Senders</h2>
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
  return Array.from({length}, (_, i) => i);
}