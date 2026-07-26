import React, { useState } from 'react';
import { Sender } from '../types';

interface SenderListProps {
    senders: Sender[];
    selectedSender: string | null;
    onSelectSender: (macAddress: string) => void;
    onUpdateAlias: (macAddress: string, newAlias: string) => void;
}

export const SenderList: React.FC<SenderListProps> = (
    { senders, selectedSender, onSelectSender, onUpdateAlias }
) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    
    const startEditing = (macAddress: string, currentAlias: string) => {
        setEditingId(macAddress);
        setEditValue(currentAlias);
    };
    
    const saveEdit = (macAddress: string) => {
        if (editValue.trim()) {
            onUpdateAlias(macAddress, editValue.trim());
        }
        setEditingId(null);
    };
    
    return (
        <div className="bg-panel-dark rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-text-main">Senders</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {senders.length === 0 ? (
                    <p className="text-text-secondary text-center py-4">No senders detected</p>
                ) : (
                    senders.map(sender => (
                        <div
                            key={sender.macAddress}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedSender === sender.macAddress 
                                    ? 'bg-primary text-black'
                                    : 'bg-background-dark hover:bg-panel-dark'
                            }`}
                            onClick={() => onSelectSender(sender.macAddress)}
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