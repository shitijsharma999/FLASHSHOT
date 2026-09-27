/** Wire format version — must stay in sync with Java protocol handlers. */
export const PROTOCOL_VERSION = 1 as const;

export type ProtocolVersion = typeof PROTOCOL_VERSION;

export const SERVICE_NAMES = {
  client: "flashshot-client",
  gameServer: "flashshot-game-server",
  apiServer: "flashshot-api-server",
} as const;

export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES];

export interface HealthStatus {
  status: "UP" | "DOWN";
  service: ServiceName;
  timestamp: string;
}
