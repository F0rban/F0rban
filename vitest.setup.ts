import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// jsdom lacks these APIs; several Radix primitives and chart components need them.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

if (!("PointerEvent" in window)) {
  // Radix uses pointer events which jsdom does not implement.
  Object.defineProperty(window, "PointerEvent", { writable: true, value: MouseEvent });
}
Element.prototype.hasPointerCapture = vi.fn(() => false) as never;
Element.prototype.setPointerCapture = vi.fn() as never;
Element.prototype.releasePointerCapture = vi.fn() as never;
