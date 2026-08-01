import React, { useState, useRef } from 'react';
import { Sender } from '../types';

interface SenderListProps {
    senders: Sender[];
    selectedSender: string | null;
    onSelectSender: (macAddress: string) => void;
    onUpdateAlias: (macAddress: string, newAlias: string) => void;
    onUpdateDistance: (macAddress: string, distance: number) => void;
    onReorder: (newOrder: Sender[]) => void;
}

export const SenderList: React.FC<SenderListProps> = (
    { senders, selectedSender, onSelectSender, onUpdateAlias, onUpdateDistance, onReorder }
) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editingDistanceId, setEditingDistanceId] = useState<string | null>(null);
    const [editDistanceValue, setEditDistanceValue] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const startEditing = (macAddress: string, currentAlias: string) => {
        setEditingId(macAddress);
        setEditValue(currentAlias);
    };

    const startEditingDistance = (macAddress: string, currentDistance: number = 75) => {
        setEditingDistanceId(macAddress);
        setEditDistanceValue(currentDistance.toString());
    };

    const saveEdit = (macAddress: string) => {
        if (editValue.trim()) {
            onUpdateAlias(macAddress, editValue.trim());
        }
        setEditingId(null);
    };

    const saveDistanceEdit = (macAddress: string) => {
        const distance = parseFloat(editDistanceValue);
        if (!isNaN(distance) && distance > 0) {
            onUpdateDistance(macAddress, distance);
        }
        setEditingDistanceId(null);
    };

    const handleDragStart = (index: number) => {
        dragItem.current = index;
        setIsDragging(true);
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const newSenders = [...senders];
            const draggedItem = newSenders[dragItem.current];
            newSenders.splice(dragItem.current, 1);
            newSenders.splice(dragOverItem.current, 0, draggedItem);
            onReorder(newSenders);
        }
        dragItem.current = null;
        dragOverItem.current = null;
        setIsDragging(false);
    };

    return (
        <div className="bg-panel-dark rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-text-main">Senders</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto" ref={containerRef}>
                {senders.length === 0 ? (
                    <p className="text-text-secondary text-center py-4">No senders detected</p>
                ) : (
                    senders.map((sender, index) => (
                        <div
                            key={sender.macAddress}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedSender === sender.macAddress 
                                    ? 'bg-primary text-black'
                                    : 'bg-background-dark hover:bg-panel-dark'
                            }`}
                            onClick={() => onSelectSender(sender.macAddress)}
                            draggable={true}
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="flex items-center justify-between">
                                {editingId === sender.macAddress ? (
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => saveEdit(sender.macAddress)}
                                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(sender.macAddress)}
                                        className="bg-transparent border border-text-secondary rounded px-2 py-1 text-sm flex-1"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex-1">
                                        <div className="font-medium">{sender.alias}</div>
                                        <div className="text-xs text-text-secondary">{sender.macAddress}</div>
                                        {editingDistanceId === sender.macAddress ? (
                                            <div className="mt-1">
                                                <input
                                                    type="number"
                                                    value={editDistanceValue}
                                                    onChange={(e) => setEditDistanceValue(e.target.value)}
                                                    onBlur={() => saveDistanceEdit(sender.macAddress)}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveDistanceEdit(sender.macAddress)}
                                                    className="bg-transparent border border-text-secondary rounded px-2 py-1 text-xs w-16"
                                                    autoFocus
                                                />
                                                <span className="text-xs text-text-secondary ml-1">m</span>
                                            </div>
                                        ) : (
                                            <div className="mt-1">
                                                <span className="text-xs text-text-secondary">Distance: {sender.distanceToNext || 75}m</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditingDistance(sender.macAddress, sender.distanceToNext || 75);
                                                    }}
                                                    className="ml-2 text-xs bg-panel-dark px-1 py-0.5 rounded hover:bg-background-dark"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEditing(sender.macAddress, sender.alias);
                                    }}
                                    className="ml-2 text-xs bg-panel-dark px-2 py-1 rounded hover:bg-background-dark"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};