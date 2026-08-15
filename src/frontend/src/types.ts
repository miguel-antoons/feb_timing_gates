// Message types from receiver.ino
export enum MessageType {
    BEAM_EVENT = 1,
    IDENTIFY_SENDER_REQUEST = 2,
    IDENTIFY_RECEIVER_REQUEST = 12
}

// Sender information
export interface Sender {
    macAddress: string;
    alias: string;
    distanceToPrevious: number; // Distance to next gate
}


export interface TimingEvent {
    sessionId: number;
    timestamp: number; // in ms
    timeDiff: number; // in ms
    macAddress: string;
    senderAlias: string;
    speed: number; // in kph
}
