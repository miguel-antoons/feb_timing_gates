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