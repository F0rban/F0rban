import { cn } from "@/lib/utils/cn";
import { PROVIDERS } from "@/lib/data/seed/providers";
import type { ProviderId } from "@/lib/data/types";

const SIZES = {
  xs: "size-5 text-[8.5px] rounded-[5px]",
  sm: "size-6 text-[9.5px] rounded-[6px]",
  md: "size-8 text-[11px] rounded-[7px]",
  lg: "size-10 text-[13px] rounded-[9px]",
} as const;

/**
 * Provider identity tile.
 *
 * Deliberately a typographic monogram rather than a scraped brand logo: it
 * stays legible at 20px, works in both themes, and never renders a company's
 * mark incorrectly. Colour comes from the categorical series palette, so a
 * provider keeps the same hue in tiles and in charts.
 */
export function ProviderMark({
  provider,
  size = "md",
  className,
  label,
}: {
  provider: ProviderId;
  size?: keyof typeof SIZES;
  className?: string;
  label?: string;
}) {
  const meta = PROVIDERS[provider] ?? PROVIDERS.other;
  const color = `var(--series-${meta.series})`;

  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid shrink-0 place-items-center border font-mono font-semibold uppercase",
        "tracking-[0.02em] tabular-nums select-none",
        SIZES[size],
        className,
      )}
      style={{
        color,
        borderColor: `color-mix(in oklch, ${color} 34%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
      }}
    >
      {meta.monogram}
    </span>
  );
}

/** A small colour chip used in legends and series keys. */
export function SeriesDot({ series, className }: { series: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-[3px]", className)}
      style={{ backgroundColor: `var(--series-${((series - 1) % 8) + 1})` }}
    />
  );
}
