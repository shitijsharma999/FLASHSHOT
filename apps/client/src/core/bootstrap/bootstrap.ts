import { Color4, Scene } from "@babylonjs/core";
import { clientConfig } from "../config/env";
import { logger } from "../logging/logger";
import { AppLifecycle } from "../lifecycle/app-lifecycle";
import { createGameEngine } from "../../rendering/engine/create-engine";
import { checkApiHealth } from "../../networking/health/api-health";
import { connectGameServer } from "../../networking/websocket/game-server-connection";

function setStatus(elementId: string, text: string, className: string): void {
  const el = document.getElementById(elementId);
  if (!el) {
    return;
  }
  el.textContent = text;
  el.className = className;
}

export async function bootstrapClient(lifecycle: AppLifecycle): Promise<() => void> {
  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #game-canvas element");
  }

  logger.info("client.bootstrap.start", { app: clientConfig.appName });

  const { engine, backend } = await createGameEngine(canvas);
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.04, 0.06, 0.09, 1);

  setStatus("status-renderer", backend.toUpperCase(), "status-ok");

  engine.runRenderLoop(() => {
    scene.render();
  });

  const resize = () => engine.resize();
  window.addEventListener("resize", resize);

  void checkApiHealth(clientConfig.apiBaseUrl)
    .then((ok) => {
      setStatus(
        "status-api",
        ok ? "Healthy" : "Unavailable",
        ok ? "status-ok" : "status-warn",
      );
    })
    .catch(() => setStatus("status-api", "Unavailable", "status-warn"));

  void connectGameServer(clientConfig.gameServerWsUrl)
    .then((result) => {
      setStatus(
        "status-game-server",
        result.connected ? `Connected (protocol v${result.protocolVersion})` : "Failed",
        result.connected ? "status-ok" : "status-error",
      );
    })
    .catch(() => setStatus("status-game-server", "Failed", "status-error"));

  lifecycle.setState("ready");
  logger.info("client.bootstrap.ready", { backend });

  return () => {
    window.removeEventListener("resize", resize);
    scene.dispose();
    engine.dispose();
    lifecycle.setState("stopped");
  };
}
