"use client";

import { create } from "zustand";
import { createId } from "../utils/id";

export type ToastTone = "default" | "success" | "warning" | "danger";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  /** Optional single undo-style action. */
  action?: { label: string; run: () => void };
  duration: number;
}

interface UiState {
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  toasts: Toast[];

  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;

  toast: (input: Omit<Toast, "id" | "tone" | "duration"> & { tone?: ToastTone; duration?: number }) => string;
  dismissToast: (id: string) => void;
}

const SIDEBAR_KEY = "acc.ui.sidebar";

function readSidebar(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_KEY) === "1";
}

export const useUiStore = create<UiState>()((set, get) => ({
  paletteOpen: false,
  shortcutsOpen: false,
  sidebarCollapsed: false,
  mobileNavOpen: false,
  toasts: [],

  setPaletteOpen: (open) => set({ paletteOpen: open }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),

  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      }
      return { sidebarCollapsed: next };
    }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  toast: ({ tone = "default", duration = 4200, ...rest }) => {
    const id = createId("toast");
    set((s) => ({ toasts: [...s.toasts, { id, tone, duration, ...rest }].slice(-4) }));
    if (duration > 0 && typeof window !== "undefined") {
      setTimeout(() => get().dismissToast(id), duration);
    }
    return id;
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Restores the persisted sidebar state on first client render. */
export function initUiFromStorage() {
  useUiStore.getState().setSidebarCollapsed(readSidebar());
}
