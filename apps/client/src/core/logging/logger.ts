export type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry = {
    level,
    message,
    ...context,
    ts: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);
  switch (level) {
    case "debug":
      console.debug(line);
      break;
    case "info":
      console.info(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
};
