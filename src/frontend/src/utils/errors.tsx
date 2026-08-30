import { MessageType } from "../types";

export const ERRORS = {
  [MessageType.ADD_PEER_FAILURE]: "Receiver notified: Failed to add peer.",
  [MessageType.IDENTIFY_REQUEST_SUCCESS]: "Receiver notified: Failed to identify sender.",
  [MessageType.IDENTIFY_REQUEST_FAILURE]: "Receiver notified: Failed to identify sender.",
  [MessageType.INVALID_MAC_FORMAT]: "Receiver notified: Invalid MAC address format.",
  [MessageType.RCVD_SIZE_MISMATCH]: "Receiver or Sender notifed: Received size mismatch.",
  [MessageType.ESP_NOW_INIT_FAILURE]: "Receiver notified: ESP-NOW initialization failed.",
  [MessageType.IDENTIFY_RECEIVER_REQUEST]: "Receiver notified: Failed to identify receiver.",
  [MessageType.UNKNOWN_MESSAGE_TYPE]: "Receiver notified: Unknown message type received.",
  [MessageType.WRONG_MESSAGE_FORMAT]: "Receiver notified: Wrong message format received.",
};