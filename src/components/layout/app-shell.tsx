"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNavSheet, MobileTabBar } from "./mobile-nav";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { CommandPalette } from "@/components/command/command-palette";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { Toaster } from "@/components/ui/toaster";
import { useUiStore, initUiFromStorage } from "@/lib/store/ui";
import { useWorkspace } from "@/hooks/use-workspace";
import { useHotkey } from "@/hooks/use-hotkey";
import { applyTheme, readStoredTheme } from "@/lib/theme";

/** Global hotkeys. Kept in one place so conflicts are visible. */
function GlobalHotkeys() {
  const router = useRouter();
  const togglePalette = useUiStore((s) => s.togglePalette);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  useHotkey("mod+k", togglePalette, { allowInInput: true });
  useHotkey("?", () => setShortcutsOpen(true));
  useHotkey("[", toggleSidebar);
  useHotkey("g d", useCallback(() => router.push("/"), [router]));
  useHotkey("g r", useCallback(() => router.push("/projects"), [router]));
  useHotkey("g p", useCallback(() => router.push("/prompts"), [router]));
  useHotkey("g t", useCallback(() => router.push("/tools"), [router]));
  useHotkey("g m", useCallback(() => router.push("/models"), [router]));
  useHotkey("g w", useCallback(() => router.push("/workflows"), [router]));
  useHotkey("g s", useCallback(() => router.push("/spending"), [router]));
  useHotkey("g ,", useCallback(() => router.push("/settings"), [router]));
  useHotkey("n", useCallback(() => router.push("/prompts?new=1"), [router]));

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { workspace, ready } = useWorkspace();

  useEffect(() => {
    initUiFromStorage();
    applyTheme(readStoredTheme());
  }, []);

  // The workspace is the source of truth once hydrated, so a theme chosen on
  // another device (or restored from an import) wins over the local mirror.
  useEffect(() => {
    if (ready && workspace) applyTheme(workspace.preferences.theme);
  }, [ready, workspace?.preferences.theme]); // eslint-disable-line react-hooks/exhaustive-deps

  // Density and motion preferences are attributes on the root, so a single
  // CSS rule covers every component rather than threading props everywhere.
  useEffect(() => {
    if (!ready || !workspace) return;
    const root = document.documentElement;
    root.toggleAttribute("data-reduce-motion", workspace.preferences.reduceMotion);
    root.dataset.density = workspace.preferences.compactDensity ? "compact" : "default";
  }, [ready, workspace?.preferences.reduceMotion, workspace?.preferences.compactDensity]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsOnboarding = ready && workspace !== null && !workspace.preferences.onboardingComplete;

  return (
    <TooltipProvider delayDuration={320} skipDelayDuration={280}>
      <GlobalHotkeys />
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="min-w-0 flex-1 pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <MobileTabBar />
      <MobileNavSheet />
      <CommandPalette />
      <ShortcutsDialog />
      <Toaster />
      {needsOnboarding && <OnboardingFlow />}
    </TooltipProvider>
  );
}
