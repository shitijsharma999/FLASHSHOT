import { bootstrapClient } from "./core/bootstrap/bootstrap";
import { AppLifecycle } from "./core/lifecycle/app-lifecycle";
import { logger } from "./core/logging/logger";

const lifecycle = new AppLifecycle();

bootstrapClient(lifecycle).catch((error: unknown) => {
  logger.error("client.bootstrap.failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  const renderer = document.getElementById("status-renderer");
  if (renderer) {
    renderer.textContent = "Failed";
    renderer.className = "status-error";
  }
});
