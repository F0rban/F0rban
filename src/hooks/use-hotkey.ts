"use client";

import { useEffect } from "react";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/** Single punctuation characters carry their shift state in `event.key`. */
const SHIFT_ENCODED = /^[^a-z0-9]$/;

export interface HotkeyOptions {
  /** Fire even when focus is inside a field. Needed for ⌘K. */
  allowInInput?: boolean;
  enabled?: boolean;
}

/**
 * Binds a single hotkey. Combo syntax: "mod+k", "shift+/", "g p", "escape".
 * "mod" is ⌘ on Apple platforms and Ctrl elsewhere. A space means a sequence.
 */
export function useHotkey(
  combo: string,
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
) {
  const { allowInInput = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;
    const steps = combo.toLowerCase().split(" ").filter(Boolean);
    let sequenceIndex = 0;
    let sequenceTimer: ReturnType<typeof setTimeout> | null = null;

    const matches = (step: string, event: KeyboardEvent) => {
      const parts = step.split("+");
      const key = parts[parts.length - 1]!;
      const needMod = parts.includes("mod");
      const needShift = parts.includes("shift");
      const needAlt = parts.includes("alt");
      const isApple =
        typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
      const modPressed = isApple ? event.metaKey : event.ctrlKey;

      if (needMod !== modPressed) return false;
      if (needAlt !== event.altKey) return false;

      // A punctuation key already encodes its own shift state: pressing shift
      // and "/" reports "?", never "/" with shiftKey. Requiring a shift match
      // on top of that can never be satisfied, so bind "?" and ignore shift.
      if (!SHIFT_ENCODED.test(key) && needShift !== event.shiftKey) return false;

      const pressed = event.key.toLowerCase();
      return pressed === key || (key === "escape" && pressed === "esc");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!allowInInput && isEditable(event.target)) return;

      if (steps.length === 1) {
        if (matches(steps[0]!, event)) {
          event.preventDefault();
          handler(event);
        }
        return;
      }

      if (matches(steps[sequenceIndex]!, event)) {
        sequenceIndex += 1;
        if (sequenceTimer) clearTimeout(sequenceTimer);
        if (sequenceIndex === steps.length) {
          sequenceIndex = 0;
          event.preventDefault();
          handler(event);
        } else {
          sequenceTimer = setTimeout(() => { sequenceIndex = 0; }, 900);
        }
      } else {
        sequenceIndex = 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (sequenceTimer) clearTimeout(sequenceTimer);
    };
  }, [combo, handler, allowInInput, enabled]);
}

