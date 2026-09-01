"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatAxisMoney, formatMoneyCompact } from "@/lib/utils/format";
import { useMeasure } from "./use-measure";
import { niceMax, ticks } from "./path";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
  meta?: string;
}

export function BarChart({
  data,
  height = 180,
  formatValue = formatMoneyCompact,
  className,
  ariaLabel,
}: {
  data: BarDatum[];
  height?: number;
  formatValue?: (value: number) => string;
  className?: string;
  ariaLabel?: string;
}) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);

  const padding = { top: 10, right: 4, bottom: 24, left: 44 };
  const innerW = Math.max(0, width - padding.left - padding.right);
  const innerH = Math.max(0, height - padding.top - padding.bottom);
  const max = niceMax(Math.max(0.0001, ...data.map((d) => d.value)) * 1.1);
  const slot = data.length ? innerW / data.length : 0;
  const barWidth = Math.max(4, Math.min(38, slot * 0.62));

  return (
    <div ref={ref} className={cn("relative w-full min-w-0", className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel ?? "Bar chart"}>
          {ticks(max, 4).map((value) => {
            const y = padding.top + innerH - (value / max) * innerH;
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="var(--grid)"
                  strokeWidth={1}
                  strokeDasharray={value === 0 ? undefined : "2 4"}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[var(--ink-4)] font-mono text-[9.5px] tabular-nums"
                >
                  {formatAxisMoney(value)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const barHeight = Math.max(1.5, (d.value / max) * innerH);
            const x = padding.left + slot * i + (slot - barWidth) / 2;
            const y = padding.top + innerH - barHeight;
            const color = d.color ?? "var(--series-1)";
            return (
              <g
                key={d.key}
                onPointerEnter={() => setHover(d.key)}
                onPointerLeave={() => setHover(null)}
              >
                <rect
                  x={padding.left + slot * i}
                  y={padding.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                />
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={3}
                  fill={color}
                  opacity={hover && hover !== d.key ? 0.4 : 0.92}
                  className="transition-opacity duration-150"
                />
                <text
                  x={padding.left + slot * i + slot / 2}
                  y={height - 7}
                  textAnchor="middle"
                  className={cn(
                    "text-[9.5px] transition-colors",
                    hover === d.key ? "fill-[var(--ink-2)]" : "fill-[var(--ink-4)]",
                  )}
                >
                  {d.label}
                </text>
                {hover === d.key && (
                  <text
                    x={padding.left + slot * i + slot / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-[var(--ink)] font-mono text-[10px] font-medium tabular-nums"
                  >
                    {formatValue(d.value)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** Horizontal breakdown rows. Better than a bar chart when labels are long. */
export function BreakdownBars({
  data,
  formatValue = formatMoneyCompact,
  max: explicitMax,
  className,
  showShare = true,
}: {
  data: BarDatum[];
  formatValue?: (value: number) => string;
  max?: number;
  className?: string;
  showShare?: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const max = explicitMax ?? Math.max(0.0001, ...data.map((d) => d.value));

  return (
    <ul className={cn("space-y-2.5", className)}>
      {data.map((d) => (
        <li key={d.key} className="group">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[12.5px] text-ink-2 transition-colors group-hover:text-ink">
              {d.label}
            </span>
            <span className="flex shrink-0 items-baseline gap-2">
              {showShare && total > 0 && (
                <span className="font-mono text-[10.5px] tabular-nums text-ink-4">
                  {((d.value / total) * 100).toFixed(0)}%
                </span>
              )}
              <span className="font-mono text-[12px] font-medium tabular-nums text-ink">
                {formatValue(d.value)}
              </span>
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-quint)]"
              style={{
                width: `${Math.max(1.5, (d.value / max) * 100)}%`,
                backgroundColor: d.color ?? "var(--series-1)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
