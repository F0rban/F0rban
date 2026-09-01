"use client";

import { useEffect, useState } from "react";

/**
 * Reads a media query on the client.
 *
 * Starts false so server and first client render agree, then corrects after
 * mount — layout that depends on it must be safe in the false state.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Matches the Tailwind `lg` breakpoint, where master-detail becomes two panes. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
