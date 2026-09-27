export type AppLifecycleState = "booting" | "ready" | "stopped";

type Listener = (state: AppLifecycleState) => void;

export class AppLifecycle {
  #state: AppLifecycleState = "booting";
  readonly #listeners = new Set<Listener>();

  get state(): AppLifecycleState {
    return this.#state;
  }

  onChange(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  setState(next: AppLifecycleState): void {
    if (this.#state === next) {
      return;
    }
    this.#state = next;
    for (const listener of this.#listeners) {
      listener(next);
    }
  }
}
