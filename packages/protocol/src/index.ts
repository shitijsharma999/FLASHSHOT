import { PROTOCOL_VERSION } from "@flashshot/shared-types";

/** Client → server during Phase 0 handshake only (no gameplay payloads yet). */
export const PacketType = {
  HELLO: 0x01,
  HELLO_ACK: 0x02,
} as const;

export type PacketTypeValue = (typeof PacketType)[keyof typeof PacketType];

export interface HelloPacket {
  type: typeof PacketType.HELLO;
  protocolVersion: number;
  clientId: string;
}

export interface HelloAckPacket {
  type: typeof PacketType.HELLO_ACK;
  protocolVersion: number;
  serverTimeMs: number;
}

export function createHello(clientId: string): HelloPacket {
  return {
    type: PacketType.HELLO,
    protocolVersion: PROTOCOL_VERSION,
    clientId,
  };
}

export function encodeHelloJson(packet: HelloPacket): string {
  return JSON.stringify(packet);
}

export function decodeHelloAckJson(payload: string): HelloAckPacket {
  const parsed = JSON.parse(payload) as HelloAckPacket;
  if (parsed.type !== PacketType.HELLO_ACK) {
    throw new Error("Expected HELLO_ACK packet");
  }
  return parsed;
}
