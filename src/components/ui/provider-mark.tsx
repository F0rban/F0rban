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
  fallbackName,
}: {
  provider: ProviderId;
  size?: keyof typeof SIZES;
  className?: string;
  label?: string;
  /** Used to derive a monogram when the provider is "other". */
  fallbackName?: string;
}) {
  const meta = PROVIDERS[provider] ?? PROVIDERS.other;
  const monogram =
    provider === "other" && fallbackName ? initials(fallbackName) : meta.monogram;
  // Keep "other" tools visually distinct from each other rather than all
  // sharing one slot in the palette.
  const seriesIndex =
    provider === "other" && fallbackName ? (hash(fallbackName) % 8) + 1 : meta.series;
  const color = `var(--series-${seriesIndex})`;

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
      {monogram}
    </span>
  );
}

function initials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return (words[0] ?? name).slice(0, 2).toUpperCase();
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
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
