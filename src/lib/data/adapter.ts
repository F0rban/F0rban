import type { Workspace } from "./types";

/**
 * The single seam between the app and its storage.
 *
 * Everything above this interface — stores, hooks, components — is unaware of
 * where a workspace lives. Swapping `LocalStorageAdapter` for a Supabase or
 * Postgres-backed implementation is the whole migration; no component changes.
 */
export interface WorkspaceAdapter {
  readonly name: string;
  /** Returns null when no workspace has been persisted yet. */
  load(): Promise<Workspace | null>;
  save(workspace: Workspace): Promise<void>;
  clear(): Promise<void>;
}

/** Used by tests and by SSR, where there is no persistent store at all. */
export class MemoryAdapter implements WorkspaceAdapter {
  readonly name = "memory";
  private snapshot: Workspace | null;

  constructor(initial: Workspace | null = null) {
    this.snapshot = initial;
  }

  async load(): Promise<Workspace | null> {
    return this.snapshot ? structuredClone(this.snapshot) : null;
  }

  async save(workspace: Workspace): Promise<void> {
    this.snapshot = structuredClone(workspace);
  }

  async clear(): Promise<void> {
    this.snapshot = null;
  }
}
