import { describe, expect, it } from "vitest";
import { PROTOCOL_VERSION, SERVICE_NAMES } from "../src/index";

describe("shared-types", () => {
  it("exports protocol version 1", () => {
    expect(PROTOCOL_VERSION).toBe(1);
  });

  it("defines stable service names", () => {
    expect(SERVICE_NAMES.gameServer).toBe("flashshot-game-server");
  });
});
