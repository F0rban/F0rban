/** Display formatting. Pure, locale-stable (en-US) so SSR and CSR agree. */

const LOCALE = "en-US";

export function formatCurrency(
  value: number,
  opts: { maximumFractionDigits?: number; minimumFractionDigits?: number; currency?: string } = {},
): string {
  const abs = Math.abs(value);
  const max = opts.maximumFractionDigits ?? (abs >= 1000 ? 0 : abs >= 1 ? 2 : 3);
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: opts.currency ?? "USD",
    minimumFractionDigits: opts.minimumFractionDigits ?? Math.min(max, 2),
    maximumFractionDigits: max,
  }).format(value);
}

/** Money for dense tables: no cents above $1,000, always a leading $. */
export function formatMoneyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000) {
    return `${value < 0 ? "-" : ""}$${(abs / 1000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  }
  return formatCurrency(value);
}

/** Axis-tick money: never wider than five glyphs. "$8" · "$450" · "$1.2k". */
export function formatAxisMoney(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  if (abs === 0) return "0";
  // Keep the half-step visible: an axis tick at 12.5 must not read "$13".
  if (abs >= 10) return `${sign}$${Number.isInteger(abs) ? abs : abs.toFixed(1)}`;
  return `${sign}$${abs.toFixed(abs < 1 ? 2 : 1)}`;
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value);
}

/** 1_240_000 → "1.24M". Used for context windows and token counts. */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(m < 10 ? 2 : 1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(k < 10 ? 1 : 0)}K`;
  }
  return String(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value >= 0 ? "" : "-"}${Math.abs(value).toFixed(digits)}%`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
