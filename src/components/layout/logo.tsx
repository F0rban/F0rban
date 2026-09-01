import { cn } from "@/lib/utils/cn";

/**
 * Product mark: a tally.
 *
 * Four strokes and a slash — the oldest way of recording that something
 * happened, repeatedly, and counting it up afterwards. That is the whole
 * product. It is also not a spark, a brain or a hexagon.
 */
export function Logo({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect
        x="1.25"
        y="1.25"
        width="21.5"
        height="21.5"
        rx="6.25"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <line x1="7.4" y1="6.6" x2="7.4" y2="17.4" strokeOpacity="0.55" />
        <line x1="11.2" y1="6.6" x2="11.2" y2="17.4" strokeOpacity="0.55" />
        <line x1="15" y1="6.6" x2="15" y2="17.4" strokeOpacity="0.55" />
        <line x1="5.6" y1="17.2" x2="18.4" y2="6.8" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex min-w-0 flex-col leading-none", className)}>
      <span className="truncate text-[14px] font-semibold tracking-[-0.02em] text-ink">Bench</span>
      <span className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.16em] text-ink-4">
        Model evidence
      </span>
    </span>
  );
}
