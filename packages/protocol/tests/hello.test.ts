import { describe, expect, it } from "vitest";
import {
  PacketType,
  createHello,
  decodeHelloAckJson,
  encodeHelloJson,
} from "../src/index";

describe("protocol hello", () => {
  it("round-trips hello ack JSON for bootstrap handshake", () => {
    const hello = createHello("test-client");
    expect(hello.type).toBe(PacketType.HELLO);

    const ack = {
      type: PacketType.HELLO_ACK,
      protocolVersion: 1,
      serverTimeMs: 123,
    };
    const decoded = decodeHelloAckJson(JSON.stringify(ack));
    expect(decoded.serverTimeMs).toBe(123);
    expect(encodeHelloJson(hello)).toContain("test-client");
  });
});
