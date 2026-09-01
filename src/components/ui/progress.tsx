import { cn } from "@/lib/utils/cn";

export function Progress({
  value,
  max = 100,
  tone = "accent",
  className,
  /** Optional secondary marker, e.g. a forecast beyond current spend. */
  marker,
  markerLabel,
  size = "md",
  label,
  labelledBy,
}: {
  value: number;
  max?: number;
  tone?: "accent" | "positive" | "warning" | "negative";
  className?: string;
  marker?: number;
  markerLabel?: string;
  size?: "sm" | "md";
  /** What the bar measures. Required unless `labelledBy` points at a label. */
  label?: string;
  labelledBy?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const markerPct = marker !== undefined && max > 0 ? Math.min(100, (marker / max) * 100) : null;
  const colors = {
    accent: "bg-accent",
    positive: "bg-positive",
    warning: "bg-warning",
    negative: "bg-negative",
  } as const;

  return (
    <div
      role="progressbar"
      aria-label={labelledBy ? undefined : (label ?? "Progress")}
      aria-labelledby={labelledBy}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(pct)}%`}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-surface-3",
        size === "sm" ? "h-1" : "h-1.5",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-quint)]", colors[tone])}
        style={{ width: `${pct}%` }}
      />
      {markerPct !== null && markerPct > pct && (
        <span
          aria-label={markerLabel}
          title={markerLabel}
          className="absolute inset-y-0 w-px bg-ink-3"
          style={{ left: `${markerPct}%` }}
        />
      )}
    </div>
  );
}
