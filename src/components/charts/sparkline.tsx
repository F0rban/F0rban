"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { linearPath, monotonePath, type Point } from "./path";

/** Compact trend indicator for KPI tiles. No axes, no labels — shape only. */
export function Sparkline({
  values,
  width = 88,
  height = 26,
  color = "var(--accent)",
  fill = true,
  smooth = true,
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  smooth?: boolean;
  className?: string;
}) {
  const { line, area, last } = useMemo(() => {
    if (values.length < 2) return { line: "", area: "", last: null };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const pad = 2.5;
    const points: Point[] = values.map((v, i) => ({
      x: (i / (values.length - 1)) * width,
      y: pad + (1 - (v - min) / span) * (height - pad * 2),
    }));
    const draw = smooth ? monotonePath : linearPath;
    const line = draw(points);
    return {
      line,
      area: `${line} L ${width} ${height} L 0 ${height} Z`,
      last: points[points.length - 1]!,
    };
  }, [values, width, height, smooth]);

  if (!line) return null;
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      width={width}
      height={height}
      aria-hidden
      className={cn("overflow-visible", className)}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {last && <circle cx={last.x} cy={last.y} r={1.8} fill={color} />}
    </svg>
  );
}
