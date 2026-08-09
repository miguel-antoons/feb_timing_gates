export interface Lap {
    number: number;
    timeMs: number;
    formattedTime: string;
    sector1Ms?: number; // Raw ms for calculation
    sector1?: string; // Formatted string
    speed?: number; // Calculated speed
    delta: number; // vs best lap
    timestamp: Date;
    isBest?: boolean;
    senderId?: string; // MAC address of the sender
    sectorTimes?: number[]; // Times between gates for multi-gate support
    lapSpeed?: number; // Speed for completing the full lap
}

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
    // lastEventTime?: number; // Timestamp of last event
    // lastEventTimeDiff?: number; // Time difference from previous event
    // order?: number; // Order for drag and drop
    distanceToNext: number; // Distance to next gate
}

export enum SessionStatus {
    IDLE = 'IDLE',
    RUNNING = 'RUNNING',
    STOPPED = 'STOPPED'
}

export interface SessionData {
    laps: Lap[];
    bestLapMs: number | null;
    currentLapNumber: number;
    startTime: Date | null;
}

export interface TelemetryData {
    speed: number;
    battery: number;
    delta: number;
}

export interface Driver {
    id: string;
    position: number;
    name: string;
    team: string;
    time: string;
    gap: string;
    status?: string;
}

export enum RaceStatus {
    GREEN = 'GREEN',
    YELLOW = 'YELLOW',
    RED = 'RED',
    FINISH = 'FINISH'
}