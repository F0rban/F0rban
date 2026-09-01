"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

function arc(cx: number, cy: number, r: number, start: number, end: number): string {
  const startX = cx + r * Math.cos(start);
  const startY = cy + r * Math.sin(start);
  const endX = cx + r * Math.cos(end);
  const endY = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${endX} ${endY}`;
}

/**
 * Donut rendered as stroked arcs rather than filled wedges: the gap between
 * segments stays a constant pixel width at any radius, and hover can thicken a
 * segment without changing its geometry.
 */
export function Donut({
  slices,
  size = 148,
  thickness = 16,
  centerLabel,
  centerValue,
  className,
  onHover,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
  onHover?: (key: string | null) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const segments = useMemo(() => {
    const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
    if (total <= 0) return [];
    let angle = -Math.PI / 2;
    const gap = 0.022;
    return slices
      .filter((s) => s.value > 0)
      .map((slice) => {
        const sweep = (slice.value / total) * Math.PI * 2;
        const start = angle + gap / 2;
        const end = angle + sweep - gap / 2;
        angle += sweep;
        return { slice, d: arc(cx, cy, radius, start, Math.max(start + 0.004, end)), share: slice.value / total };
      });
  }, [slices, cx, cy, radius]);

  return (
    <svg
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={centerLabel ? `${centerLabel} breakdown` : "Breakdown"}
      onPointerLeave={() => {
        setActive(null);
        onHover?.(null);
      }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--surface-3)"
        strokeWidth={thickness * 0.5}
      />
      {segments.map(({ slice, d }) => (
        <path
          key={slice.key}
          d={d}
          fill="none"
          stroke={slice.color}
          strokeWidth={active === slice.key ? thickness + 3 : thickness}
          strokeLinecap="butt"
          className="cursor-pointer transition-[stroke-width,opacity] duration-200"
          opacity={active && active !== slice.key ? 0.35 : 1}
          onPointerEnter={() => {
            setActive(slice.key);
            onHover?.(slice.key);
          }}
        />
      ))}
      {(centerValue || centerLabel) && (
        <g pointerEvents="none">
          {centerValue && (
            <text
              x={cx}
              y={cy + (centerLabel ? 0 : 5)}
              textAnchor="middle"
              className="fill-[var(--ink)] text-[17px] font-semibold tabular-nums"
              style={{ letterSpacing: "-0.02em" }}
            >
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text
              x={cx}
              y={cy + 15}
              textAnchor="middle"
              className="fill-[var(--ink-4)] text-[9.5px] uppercase"
              style={{ letterSpacing: "0.07em" }}
            >
              {centerLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
