import { AbstractEngine, Engine, NullEngine, WebGPUEngine } from "@babylonjs/core";
import type { EngineOptions } from "@babylonjs/core";

export type RendererBackend = "webgpu" | "webgl2" | "null";

export interface EngineBootstrapResult {
  engine: AbstractEngine;
  backend: RendererBackend;
}

function navigatorHasWebGpu(): boolean {
  return "gpu" in navigator && Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
}

async function tryWebGpu(canvas: HTMLCanvasElement, options: EngineOptions): Promise<WebGPUEngine | null> {
  if (!navigatorHasWebGpu()) {
    return null;
  }
  try {
    const engine = new WebGPUEngine(canvas, { ...options, adaptToDeviceRatio: true });
    await engine.initAsync();
    return engine;
  } catch {
    return null;
  }
}

function createWebGl2(canvas: HTMLCanvasElement, options: EngineOptions): Engine {
  const engine = new Engine(canvas, true, {
    ...options,
    adaptToDeviceRatio: true,
  });
  if (!engine.webGLVersion || engine.webGLVersion < 2) {
    engine.dispose();
    throw new Error("WebGL2 is required for the WebGL fallback path.");
  }
  return engine;
}

/** WebGPU first, WebGL2 fallback (TDD §4.2, §73 Decision B). */
export async function createGameEngine(
  canvas: HTMLCanvasElement,
  options: EngineOptions = {},
): Promise<EngineBootstrapResult> {
  const webgpu = await tryWebGpu(canvas, options);
  if (webgpu) {
    return { engine: webgpu, backend: "webgpu" };
  }

  try {
    return { engine: createWebGl2(canvas, options), backend: "webgl2" };
  } catch (error) {
    if (import.meta.env.MODE === "test") {
      return {
        engine: new NullEngine({
          renderWidth: 256,
          renderHeight: 256,
          textureSize: 256,
          deterministicLockstep: false,
          lockstepMaxSteps: 4,
        }),
        backend: "null",
      };
    }
    throw error;
  }
}
