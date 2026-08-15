import { Sender } from "../types";

// Generate a default alias for a new sender
export const generateDefaultAlias = (macAddress: string): string => {
  // Use last 3 bytes of MAC address for uniqueness
  const parts = macAddress.split(':');
  if (parts.length >= 3) {
    return `Gate-${parts.slice(-3).join('')}`;
  }
  return `Gate-${Math.floor(Math.random() * 1000)}`;
};

export const createDefaultSender = (macAddress: string): Sender => ({
  macAddress,
  alias: generateDefaultAlias(macAddress),
  distanceToPrevious: 1 // Default distance
});