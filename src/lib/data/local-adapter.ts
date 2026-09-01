import type { WorkspaceAdapter } from "./adapter";
import type { Workspace } from "./types";
import { WORKSPACE_VERSION } from "./seed";

export const STORAGE_KEY = "acc.workspace.v1";

/**
 * Browser-local persistence. Writes are debounced by the caller (the store),
 * so this stays a dumb read/write pair.
 */
export class LocalStorageAdapter implements WorkspaceAdapter {
  readonly name = "localStorage";

  constructor(private readonly key: string = STORAGE_KEY) {}

  async load(): Promise<Workspace | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Workspace;
      if (!parsed || typeof parsed !== "object") return null;
      // A version bump means the shape changed; start clean rather than
      // half-migrating a prototype workspace.
      if (parsed.version !== WORKSPACE_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async save(workspace: Workspace): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(this.key, JSON.stringify(workspace));
    } catch {
      // Quota exceeded or private mode — the app keeps working in memory.
    }
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(this.key);
  }
}
