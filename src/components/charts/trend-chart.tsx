"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatAxisMoney, formatMoneyCompact } from "@/lib/utils/format";
import { useMeasure } from "./use-measure";
import { linearPath, monotonePath, niceMax, ticks, type Point } from "./path";

export interface TrendSeries {
  key: string;
  label: string;
  /** CSS colour, usually var(--series-n). */
  color: string;
}

export interface TrendDatum {
  label: string;
  values: Record<string, number>;
}

/**
 * Stacked area / line chart with a hover crosshair.
 *
 * Hand-rolled rather than pulled from a chart library so the grid, typography
 * and hover behaviour match the rest of the design system exactly — and so the
 * bundle does not carry a general-purpose charting engine for six charts.
 */
export function TrendChart({
  data,
  series,
  height = 220,
  smooth = true,
  formatValue = formatMoneyCompact,
  className,
  showLegend = true,
  ariaLabel,
}: {
  data: TrendDatum[];
  series: TrendSeries[];
  height?: number;
  smooth?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  showLegend?: boolean;
  ariaLabel?: string;
}) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const padding = { top: 12, right: 8, bottom: 22, left: 44 };
  const innerW = Math.max(0, width - padding.left - padding.right);
  const innerH = Math.max(0, height - padding.top - padding.bottom);

  const { max, stacks, xFor } = useMemo(() => {
    const totals = data.map((d) => series.reduce((sum, s) => sum + Math.max(0, d.values[s.key] ?? 0), 0));
    const rawMax = Math.max(0.0001, ...totals);
    const max = niceMax(rawMax * 1.08);
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    const xFor = (i: number) => padding.left + (data.length > 1 ? i * step : innerW / 2);
    const yFor = (v: number) => padding.top + innerH - (v / max) * innerH;

    // Build cumulative bands so areas stack without overlapping.
    let base = data.map(() => 0);
    const stacks = series.map((s) => {
      const top = data.map((d, i) => base[i]! + Math.max(0, d.values[s.key] ?? 0));
      const band = {
        series: s,
        topPoints: top.map((v, i): Point => ({ x: xFor(i), y: yFor(v) })),
        basePoints: base.map((v, i): Point => ({ x: xFor(i), y: yFor(v) })),
      };
      base = top;
      return band;
    });

    return { max, stacks, xFor, totals };
  }, [data, series, innerW, innerH, padding.left, padding.top]);

  const yFor = (v: number) => padding.top + innerH - (v / max) * innerH;
  const draw = smooth ? monotonePath : linearPath;

  // Pick evenly spaced label slots that always include the first and last
  // point, then drop any that would collide with a neighbour.
  const labelIndices = (() => {
    if (data.length === 0) return [];
    const slots = Math.max(2, Math.min(data.length, Math.floor(width / (width > 640 ? 120 : 90))));
    const step = (data.length - 1) / (slots - 1);
    const picked = new Set<number>();
    for (let i = 0; i < slots; i++) picked.add(Math.round(i * step));
    const sorted = [...picked].sort((a, b) => a - b);
    const minGap = Math.max(1, Math.floor((data.length - 1) / (slots + 1)));
    return sorted.filter(
      (index, i) => i === 0 || index === data.length - 1 || index - sorted[i - 1]! >= minGap,
    );
  })();
  const active = hover !== null ? data[hover] : null;
  const activeTotal = active
    ? series.reduce((sum, s) => sum + (active.values[s.key] ?? 0), 0)
    : 0;

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div
        ref={ref}
        className="relative w-full min-w-0"
        style={{ height }}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(event) => {
          if (!innerW || data.length < 2) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left - padding.left;
          const index = Math.round((x / innerW) * (data.length - 1));
          setHover(Math.min(data.length - 1, Math.max(0, index)));
        }}
      >
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel ?? "Trend chart"}
            className="overflow-visible"
          >
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.30" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0.04" />
                </linearGradient>
              ))}
            </defs>

            {ticks(max, 4).map((value) => (
              <g key={value}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={yFor(value)}
                  y2={yFor(value)}
                  stroke="var(--grid)"
                  strokeWidth={1}
                  strokeDasharray={value === 0 ? undefined : "2 4"}
                />
                <text
                  x={padding.left - 8}
                  y={yFor(value) + 3.5}
                  textAnchor="end"
                  className="fill-[var(--ink-4)] font-mono text-[9.5px] tabular-nums"
                >
                  {formatAxisMoney(value)}
                </text>
              </g>
            ))}

            {stacks.map(({ series: s, topPoints, basePoints }) => {
              const areaPath = `${draw(topPoints)} L ${basePoints[basePoints.length - 1]!.x} ${basePoints[basePoints.length - 1]!.y} ${draw([...basePoints].reverse()).replace(/^M/, "L")} Z`;
              return (
                <g key={s.key}>
                  <path d={areaPath} fill={`url(#fill-${s.key})`} />
                  <path
                    d={draw(topPoints)}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

            {labelIndices.map((i) => (
              <text
                key={`${data[i]!.label}-${i}`}
                x={xFor(i)}
                y={height - 6}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                className="fill-[var(--ink-4)] text-[9.5px]"
              >
                {data[i]!.label}
              </text>
            ))}

            {hover !== null && (
              <g pointerEvents="none">
                <line
                  x1={xFor(hover)}
                  x2={xFor(hover)}
                  y1={padding.top}
                  y2={padding.top + innerH}
                  stroke="var(--ink-4)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                {stacks.map(({ series: s, topPoints }) => (
                  <circle
                    key={s.key}
                    cx={topPoints[hover]!.x}
                    cy={topPoints[hover]!.y}
                    r={3}
                    fill="var(--surface-1)"
                    stroke={s.color}
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}
          </svg>
        )}

        {active && width > 0 && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border border-line bg-overlay p-2 shadow-md"
            style={{
              left: Math.min(Math.max(0, xFor(hover!) - 70), Math.max(0, width - 150)),
            }}
          >
            <p className="mb-1 text-[10.5px] font-medium text-ink-3">{active.label}</p>
            {series.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-4 py-px">
                <span className="flex items-center gap-1.5 text-[11px] text-ink-2">
                  <span className="size-1.5 rounded-[2px]" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-ink">
                  {formatValue(active.values[s.key] ?? 0)}
                </span>
              </div>
            ))}
            {series.length > 1 && (
              <div className="mt-1 flex items-center justify-between gap-4 border-t border-line-subtle pt-1">
                <span className="text-[11px] font-medium text-ink-2">Total</span>
                <span className="font-mono text-[11px] font-medium tabular-nums text-ink">
                  {formatValue(activeTotal)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {showLegend && series.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-11">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-ink-3">
              <span className="size-1.5 rounded-[2px]" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
