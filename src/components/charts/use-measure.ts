"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Measures a container so charts can render at real pixel sizes.
 *
 * The alternative — an SVG viewBox with preserveAspectRatio — scales the text
 * along with the geometry, so axis labels end up a different size in every
 * chart. Measuring costs one ResizeObserver and keeps typography consistent.
 */
export function useMeasure<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setSize((prev) =>
      Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5
        ? prev
        : { width: rect.width, height: rect.height },
    );
  }, []);

  useEffect(() => {
    measure();
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  return { ref, ...size };
}
