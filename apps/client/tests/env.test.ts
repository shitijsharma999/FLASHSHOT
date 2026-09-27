import { describe, expect, it } from "vitest";

describe("client env contract", () => {
  it("documents required Vite variables", () => {
    const keys = ["VITE_API_BASE_URL", "VITE_GAME_SERVER_WS_URL"];
    expect(keys).toHaveLength(2);
  });
});
