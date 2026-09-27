import {
  createHello,
  decodeHelloAckJson,
  encodeHelloJson,
} from "@flashshot/protocol";

export interface GameServerConnectionResult {
  connected: boolean;
  protocolVersion?: number;
}

const CONNECT_TIMEOUT_MS = 5000;

export function connectGameServer(wsUrl: string): Promise<GameServerConnectionResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: GameServerConnectionResult) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const ws = new WebSocket(wsUrl);
    const timer = window.setTimeout(() => {
      ws.close();
      finish({ connected: false });
    }, CONNECT_TIMEOUT_MS);

    ws.addEventListener("open", () => {
      ws.send(encodeHelloJson(createHello(crypto.randomUUID())));
    });

    ws.addEventListener("message", (event) => {
      try {
        const ack = decodeHelloAckJson(String(event.data));
        finish({ connected: true, protocolVersion: ack.protocolVersion });
        ws.close();
      } catch {
        finish({ connected: false });
        ws.close();
      }
    });

    ws.addEventListener("error", () => finish({ connected: false }));
  });
}
