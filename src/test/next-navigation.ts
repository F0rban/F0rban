/**
 * Test double for next/navigation.
 *
 * Aliased in vitest.config.mts rather than mocked per file, so component tests
 * do not each need a hoisted vi.mock factory.
 */
import { vi } from "vitest";

export const push = vi.fn();
export const replace = vi.fn();
export const back = vi.fn();
export const forward = vi.fn();
export const refresh = vi.fn();
export const prefetch = vi.fn();

let searchParams = new URLSearchParams();
let pathname = "/";

export function setRoute(next: string, params: Record<string, string> = {}) {
  pathname = next;
  searchParams = new URLSearchParams(params);
  // Pages that read a parameter after mount go through window.location, so the
  // jsdom URL has to agree with the double.
  if (typeof window !== "undefined") {
    const query = searchParams.toString();
    window.history.replaceState(null, "", query ? `${next}?${query}` : next);
  }
}

export function resetRouter() {
  for (const fn of [push, replace, back, forward, refresh, prefetch]) fn.mockClear();
  setRoute("/");
}

export const useRouter = () => ({ push, replace, back, forward, refresh, prefetch });
export const usePathname = () => pathname;
export const useSearchParams = () => searchParams;
export const useParams = () => ({});
export const redirect = vi.fn();
export const notFound = vi.fn();
