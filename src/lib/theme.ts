import type { ThemeMode } from "./data/types";

export const THEME_KEY = "acc.theme";

/**
 * Applies a theme to the document.
 *
 * The workspace holds the preference, but it also mirrors into its own
 * localStorage key so the blocking boot script can read it before React runs
 * and avoid a flash of the wrong theme.
 */
export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Private mode — the theme still applies for this session.
  }
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

/** Runs before first paint. Kept tiny and dependency-free on purpose. */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem("${THEME_KEY}")||"system";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(_){}})();`;
