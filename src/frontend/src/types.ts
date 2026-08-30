// Message types from receiver.ino
export enum MessageType {
  BEAM_EVENT = 1,
  IDENTIFY_SENDER_REQUEST = 2,
  ADD_PEER_FAILURE = 3,
  IDENTIFY_REQUEST_SUCCESS = 4,
  IDENTIFY_REQUEST_FAILURE = 5,
  INVALID_MAC_FORMAT = 6,
  RCVD_SIZE_MISMATCH = 7,
  ESP_READY = 8,
  LOCAL_MAC = 9,
  ESP_HELLO = 10,
  ESP_NOW_INIT_FAILURE = 11,
  IDENTIFY_RECEIVER_REQUEST = 12,
  UNKNOWN_MESSAGE_TYPE = 13,
  WRONG_MESSAGE_FORMAT = 14
}

// Sender information
export interface Sender {
  macAddress: string;
  alias: string;
  distanceToPrevious: number; // Distance to previous gate
}


export interface TimingEvent {
  sessionId: number;
  timestamp: number; // in ms
  macAddress: string;
  senderAlias: string;
  distanceToPrevious: number; // Distance to previous gate
}


export interface SerialPortEvent {
  message_type: number;
  gps_s: number;
  gps_us: number;
  event: number;
  mac_address: string;
}

export interface SerialPortStatus {
  isConnected: boolean;
  isAvailable: boolean;
  portName: string | null;
  error: string | null;
  receiverMacAddress: string | null;
}

export interface LatestEvents {
  [macAddress: string]: number;
}
