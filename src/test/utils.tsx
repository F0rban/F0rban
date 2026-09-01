import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { vi } from "vitest";
import { Suspense, type ReactElement } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { MemoryAdapter } from "@/lib/data/adapter";
import { createSeedWorkspace } from "@/lib/data/seed";
import type { Workspace } from "@/lib/data/types";

export const TEST_NOW = new Date(2026, 4, 20, 9, 0, 0);

/** Puts the store in a hydrated state without touching localStorage. */
export function seedStore(mutate?: (workspace: Workspace) => void) {
  const workspace = createSeedWorkspace(TEST_NOW);
  mutate?.(workspace);
  useWorkspaceStore.setState({
    workspace,
    status: "ready",
    adapter: new MemoryAdapter(workspace),
  });
  useUiStore.setState({
    paletteOpen: false,
    shortcutsOpen: false,
    mobileNavOpen: false,
    sidebarCollapsed: false,
    toasts: [],
    pageTitle: null,
  });
  return workspace;
}

export function currentWorkspace(): Workspace {
  return useWorkspaceStore.getState().workspace!;
}

function Providers({ children }: { children: React.ReactNode }) {
  // Route components resolve their params with React's `use()`, which suspends.
  // Next supplies a boundary in the app; tests have to supply their own.
  return (
    <TooltipProvider delayDuration={0}>
      <Suspense fallback={null}>{children}</Suspense>
    </TooltipProvider>
  );
}

export function renderApp(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return {
    user: userEvent.setup({ pointerEventsCheck: 0 }),
    ...render(ui, { wrapper: Providers, ...options }),
  };
}

/** Captures clipboard writes so copy behaviour is assertable. */
export function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}
