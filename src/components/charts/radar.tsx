"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";

export interface RadarSeries {
  key: string;
  label: string;
  color: string;
  /** One value per axis, 0-100, in axis order. */
  values: number[];
}

/**
 * Radar comparison for model capability profiles.
 *
 * Kept to a maximum of four overlaid series — beyond that the shapes stop
 * being readable, which is why the Model Lab caps the comparison at four.
 */
export function Radar({
  axes,
  series,
  size = 260,
  className,
  levels = 4,
}: {
  axes: string[];
  series: RadarSeries[];
  size?: number;
  className?: string;
  levels?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 34;

  const angleFor = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;
  const pointFor = (i: number, value: number) => {
    const angle = angleFor(i);
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const rings = useMemo(
    () =>
      Array.from({ length: levels }, (_, level) => {
        const r = (radius * (level + 1)) / levels;
        return axes
          .map((_, i) => {
            const angle = angleFor(i);
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          })
          .join(" ");
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [axes.length, levels, radius, cx, cy],
  );

  return (
    <svg
      width={size}
      height={size}
      className={cn("shrink-0 overflow-visible", className)}
      role="img"
      aria-label={`Capability profile: ${series.map((s) => s.label).join(", ")}`}
    >
      {rings.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill={i === rings.length - 1 ? "var(--surface-2)" : "none"}
          fillOpacity={0.45}
          stroke="var(--grid)"
          strokeWidth={1}
        />
      ))}

      {axes.map((_, i) => {
        const angle = angleFor(i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + radius * Math.cos(angle)}
            y2={cy + radius * Math.sin(angle)}
            stroke="var(--grid)"
            strokeWidth={1}
          />
        );
      })}

      {series.map((s) => {
        const points = s.values.map((v, i) => pointFor(i, v));
        const path = points.map((p) => `${p.x},${p.y}`).join(" ");
        return (
          <g key={s.key}>
            <polygon points={path} fill={s.color} fillOpacity={0.13} stroke={s.color} strokeWidth={1.75} strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--surface-1)" stroke={s.color} strokeWidth={1.75} />
            ))}
          </g>
        );
      })}

      {axes.map((axis, i) => {
        const angle = angleFor(i);
        const x = cx + (radius + 17) * Math.cos(angle);
        const y = cy + (radius + 17) * Math.sin(angle);
        const anchor = Math.abs(Math.cos(angle)) < 0.25 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
        return (
          <text
            key={axis}
            x={x}
            y={y + 3}
            textAnchor={anchor}
            className="fill-[var(--ink-3)] text-[10px] font-medium capitalize"
          >
            {axis}
          </text>
        );
      })}
    </svg>
  );
}
