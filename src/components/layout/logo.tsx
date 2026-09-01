import { cn } from "@/lib/utils/cn";

/**
 * Product mark: a four-quadrant aperture. Reads as a control surface / lens
 * rather than a spark or a brain, which is the point — this is an instrument,
 * not a magic box.
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
        strokeOpacity="0.32"
        strokeWidth="1.5"
      />
      <path
        d="M12 5.25v5.1M18.75 12h-5.1M12 18.75v-5.1M5.25 12h5.1"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.9" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex min-w-0 flex-col leading-none", className)}>
      <span className="truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">
        Command Center
      </span>
      <span className="mt-0.5 truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-4">
        AI Operations
      </span>
    </span>
  );
}
