"use client";

import { useEffect, useState } from "react";

/**
 * Reads one query parameter after mount, without `useSearchParams`.
 *
 * Calling `useSearchParams` while a route is statically prerendered bails the
 * whole route out to client-side rendering: the exported HTML holds an empty
 * shell for the page body, and React logs a recoverable hydration error when it
 * loads. Pages that only need a parameter for their *initial* state can read it
 * once they are on screen instead — same result, no bailout, and the page
 * header and skeleton are in the HTML.
 *
 * Returns `undefined` until read, then the value or `null`.
 */
export function useInitialSearchParam(name: string): string | null | undefined {
  const [value, setValue] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);

  return value;
}
