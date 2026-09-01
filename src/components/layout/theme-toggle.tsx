"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemeMode } from "@/lib/data/types";
import { applyTheme, readStoredTheme } from "@/lib/theme";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { cn } from "@/lib/utils/cn";

const MODES: Array<{ value: ThemeMode; icon: typeof Sun; label: string }> = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

/**
 * Three-state theme control. The stored preference drives a blocking boot
 * script, so there is no flash on reload.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const updatePreferences = useWorkspaceStore((s) => s.updatePreferences);

  useEffect(() => {
    const stored = readStoredTheme();
    setMode(stored);
    applyTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readStoredTheme() === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const select = (next: ThemeMode) => {
    setMode(next);
    applyTheme(next);
    updatePreferences({ theme: next });
  };

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5",
        className,
      )}
    >
      {MODES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={label}
          title={label}
          onClick={() => select(value)}
          className={cn(
            "grid size-6 place-items-center rounded-[6px] transition-colors duration-150",
            mode === value
              ? "border border-line bg-surface-1 text-ink shadow-xs"
              : "text-ink-4 hover:text-ink-2",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
