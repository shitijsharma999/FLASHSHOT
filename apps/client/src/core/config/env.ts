function required(name: keyof ImportMetaEnv, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const clientConfig = {
  appName: import.meta.env.VITE_APP_NAME ?? "Flashshot",
  apiBaseUrl: required("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL),
  gameServerWsUrl: required("VITE_GAME_SERVER_WS_URL", import.meta.env.VITE_GAME_SERVER_WS_URL),
} as const;
