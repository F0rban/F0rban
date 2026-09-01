"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace";
import type { Workspace } from "@/lib/data/types";

/**
 * Hydrates the workspace once on the client and exposes it.
 *
 * `ready` is false during SSR and the first paint, which is what the skeleton
 * states key off — it is a real loading state, not a fake delay.
 */
export function useWorkspace(): { workspace: Workspace | null; ready: boolean } {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const status = useWorkspaceStore((s) => s.status);
  const hydrate = useWorkspaceStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return { workspace, ready: status === "ready" && workspace !== null };
}
