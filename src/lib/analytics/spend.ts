import type { Model, Project, SpendCategory, SpendEntry, SpendKind, ProviderId } from "../data/types";
import { addDays, daysInMonth, monthKey, parseDay, startOfMonth, toDayKey } from "../utils/date";

export type RangeKey = "7d" | "30d" | "3m" | "12m";

export const RANGES: Array<{ key: RangeKey; label: string; days: number; grain: "day" | "week" | "month" }> = [
  { key: "7d", label: "7 days", days: 7, grain: "day" },
  { key: "30d", label: "30 days", days: 30, grain: "day" },
  { key: "3m", label: "3 months", days: 91, grain: "week" },
  { key: "12m", label: "12 months", days: 365, grain: "month" },
];

export function rangeDays(range: RangeKey): number {
  return RANGES.find((r) => r.key === range)?.days ?? 30;
}

export function rangeGrain(range: RangeKey): "day" | "week" | "month" {
  return RANGES.find((r) => r.key === range)?.grain ?? "day";
}

/** Entries whose date falls in the trailing `days` window ending today. */
export function withinRange(entries: SpendEntry[], range: RangeKey, now: Date = new Date()): SpendEntry[] {
  const from = toDayKey(addDays(now, -(rangeDays(range) - 1)));
  const to = toDayKey(now);
  return entries.filter((e) => e.date >= from && e.date <= to);
}

/** The window immediately before the current one — for period-over-period deltas. */
export function previousRange(entries: SpendEntry[], range: RangeKey, now: Date = new Date()): SpendEntry[] {
  const days = rangeDays(range);
  const to = toDayKey(addDays(now, -days));
  const from = toDayKey(addDays(now, -(days * 2 - 1)));
  return entries.filter((e) => e.date >= from && e.date <= to);
}

export function total(entries: SpendEntry[]): number {
  return round(entries.reduce((sum, e) => sum + e.amount, 0));
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export interface SeriesPoint {
  key: string;
  label: string;
  value: number;
  /** Per-kind split, so a stacked chart needs no second pass. */
  parts: Record<SpendKind, number>;
}

/** Bucketed totals across the range, including empty buckets. */
export function spendSeries(
  entries: SpendEntry[],
  range: RangeKey,
  now: Date = new Date(),
): SeriesPoint[] {
  const grain = rangeGrain(range);
  const days = rangeDays(range);
  const buckets = new Map<string, SeriesPoint>();

  const makeParts = (): Record<SpendKind, number> => ({
    subscription: 0,
    usage: 0,
    credit: 0,
    "one-off": 0,
  });

  if (grain === "month") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(monthKey(d), {
        key: monthKey(d),
        label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(d),
        value: 0,
        parts: makeParts(),
      });
    }
  } else if (grain === "week") {
    for (let i = 12; i >= 0; i--) {
      const end = addDays(now, -i * 7);
      const key = toDayKey(end);
      buckets.set(key, {
        key,
        label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(end),
        value: 0,
        parts: makeParts(),
      });
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(now, -i);
      const key = toDayKey(d);
      buckets.set(key, {
        key,
        label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d),
        value: 0,
        parts: makeParts(),
      });
    }
  }

  const bucketKeys = [...buckets.keys()];

  for (const entry of withinRange(entries, range, now)) {
    let key: string | undefined;
    if (grain === "month") {
      key = entry.date.slice(0, 7);
    } else if (grain === "day") {
      key = entry.date;
    } else {
      // Week buckets are right-anchored: find the first boundary >= the entry.
      key = bucketKeys.find((k) => k >= entry.date) ?? bucketKeys[bucketKeys.length - 1];
    }
    const bucket = key ? buckets.get(key) : undefined;
    if (!bucket) continue;
    bucket.value = round(bucket.value + entry.amount);
    bucket.parts[entry.kind] = round(bucket.parts[entry.kind] + entry.amount);
  }

  return [...buckets.values()];
}

export interface Breakdown {
  key: string;
  label: string;
  value: number;
  share: number;
  series: number;
}

function toBreakdown(
  totals: Map<string, number>,
  label: (key: string) => string,
  series: (key: string, index: number) => number,
): Breakdown[] {
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([key, value]) => ({ key, value: round(value) }))
    .sort((a, b) => b.value - a.value)
    .map((row, index) => ({
      ...row,
      label: label(row.key),
      share: sum > 0 ? round((row.value / sum) * 100, 1) : 0,
      series: series(row.key, index),
    }));
}

export function byProvider(
  entries: SpendEntry[],
  nameOf: (id: ProviderId) => string,
  seriesOf: (id: ProviderId) => number,
): Breakdown[] {
  const totals = new Map<string, number>();
  for (const e of entries) totals.set(e.provider, (totals.get(e.provider) ?? 0) + e.amount);
  return toBreakdown(totals, (k) => nameOf(k as ProviderId), (k) => seriesOf(k as ProviderId));
}

export function byCategory(entries: SpendEntry[]): Breakdown[] {
  const totals = new Map<string, number>();
  for (const e of entries) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  const labels: Record<SpendCategory, string> = {
    assistant: "Assistants",
    coding: "Coding",
    image: "Image",
    video: "Video",
    audio: "Audio",
    research: "Research",
    writing: "Writing",
    productivity: "Productivity",
    api: "API usage",
    infrastructure: "Infrastructure",
  };
  return toBreakdown(totals, (k) => labels[k as SpendCategory] ?? k, (_, i) => (i % 8) + 1);
}

export function byProject(entries: SpendEntry[], projects: Project[]): Breakdown[] {
  const totals = new Map<string, number>();
  for (const e of entries) {
    const key = e.projectId ?? "__unassigned";
    totals.set(key, (totals.get(key) ?? 0) + e.amount);
  }
  const index = new Map(projects.map((p) => [p.id, p]));
  return toBreakdown(
    totals,
    (k) => (k === "__unassigned" ? "Unassigned" : (index.get(k)?.name ?? "Unknown")),
    (k, i) => (k === "__unassigned" ? 8 : (index.get(k)?.series ?? (i % 8) + 1)),
  );
}

export function byKind(entries: SpendEntry[]): Record<SpendKind, number> {
  const out: Record<SpendKind, number> = { subscription: 0, usage: 0, credit: 0, "one-off": 0 };
  for (const e of entries) out[e.kind] = round(out[e.kind] + e.amount);
  return out;
}

/* ------------------------------------------------------------------ *
 * Month-to-date, forecast, budget
 * ------------------------------------------------------------------ */

export function monthToDate(entries: SpendEntry[], now: Date = new Date()): number {
  const from = toDayKey(startOfMonth(now));
  const to = toDayKey(now);
  return total(entries.filter((e) => e.date >= from && e.date <= to));
}

export function previousMonthTotal(entries: SpendEntry[], now: Date = new Date()): number {
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const key = monthKey(prev);
  return total(entries.filter((e) => e.date.slice(0, 7) === key));
}

/**
 * Month-end projection.
 *
 * Subscriptions are not evenly spread across the month, so a naive
 * spend/day × days extrapolation is badly wrong early in the month. Instead:
 * take month-to-date, then add the trailing daily usage rate for the remaining
 * days plus any subscription renewals still to come this month.
 */
export function forecastMonthEnd(entries: SpendEntry[], now: Date = new Date()): number {
  const mtd = monthToDate(entries, now);
  const total_days = daysInMonth(now);
  const elapsed = now.getDate();
  const remaining = total_days - elapsed;
  if (remaining <= 0) return round(mtd);

  // Trailing 14-day usage rate — recent behaviour beats a month-long average.
  const windowStart = toDayKey(addDays(now, -13));
  const recentUsage = entries.filter(
    (e) => e.date >= windowStart && e.date <= toDayKey(now) && e.kind !== "subscription",
  );
  const dailyRate = total(recentUsage) / 14;

  // Subscriptions that will renew again before the month is out.
  const thisMonth = monthKey(now);
  const chargedThisMonth = new Set(
    entries
      .filter((e) => e.kind === "subscription" && e.date.slice(0, 7) === thisMonth)
      .map((e) => e.toolId ?? e.description),
  );
  const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  let upcoming = 0;
  const seen = new Set<string>();
  for (const e of entries) {
    if (e.kind !== "subscription") continue;
    if (e.date.slice(0, 7) !== lastMonth) continue;
    const id = e.toolId ?? e.description;
    if (chargedThisMonth.has(id) || seen.has(id)) continue;
    // Only count it if its billing day has not passed yet this month.
    if (parseDay(e.date).getDate() > elapsed) {
      upcoming += e.amount;
      seen.add(id);
    }
  }

  return round(mtd + dailyRate * remaining + upcoming);
}

export interface BudgetStatus {
  budget: number;
  spent: number;
  forecast: number;
  /** 0-100+, clamped only for display by the caller. */
  usedPct: number;
  forecastPct: number;
  remaining: number;
  /** Spend/day the user can afford for the rest of the month to stay under. */
  safeDailyRate: number;
  daysLeft: number;
  state: "healthy" | "watch" | "over";
}

export function budgetStatus(
  entries: SpendEntry[],
  budget: number,
  now: Date = new Date(),
): BudgetStatus {
  const spent = monthToDate(entries, now);
  const forecast = forecastMonthEnd(entries, now);
  const daysLeft = Math.max(0, daysInMonth(now) - now.getDate());
  const remaining = round(budget - spent);
  const usedPct = budget > 0 ? round((spent / budget) * 100, 1) : 0;
  const forecastPct = budget > 0 ? round((forecast / budget) * 100, 1) : 0;
  return {
    budget,
    spent,
    forecast,
    usedPct,
    forecastPct,
    remaining,
    safeDailyRate: daysLeft > 0 ? round(Math.max(0, remaining) / daysLeft) : 0,
    daysLeft,
    state: forecast > budget ? "over" : forecastPct > 85 ? "watch" : "healthy",
  };
}

/** Percentage change, guarding the divide-by-zero that ruins a KPI card. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return round(((current - previous) / Math.abs(previous)) * 100, 1);
}

/* ------------------------------------------------------------------ *
 * Model cost estimation — powers the Model Lab calculator
 * ------------------------------------------------------------------ */

export interface CostInputs {
  /** Input tokens per request. */
  tokensIn: number;
  /** Output tokens per request. */
  tokensOut: number;
  requestsPerDay: number;
}

export interface CostEstimate {
  perRequest: number;
  perDay: number;
  perMonth: number;
  inputShare: number;
}

export function estimateCost(model: Model, inputs: CostInputs): CostEstimate {
  const inputCost = (inputs.tokensIn / 1_000_000) * model.inputPrice;
  const outputCost = (inputs.tokensOut / 1_000_000) * model.outputPrice;
  const perRequest = inputCost + outputCost;
  const perDay = perRequest * inputs.requestsPerDay;
  return {
    perRequest: round(perRequest, 6),
    perDay: round(perDay, 4),
    perMonth: round(perDay * 30, 2),
    inputShare: perRequest > 0 ? round((inputCost / perRequest) * 100, 1) : 0,
  };
}

/** Blended $/1M tokens at a given output ratio — the honest single number. */
export function blendedRate(model: Model, outputRatio = 0.25): number {
  return round(model.inputPrice * (1 - outputRatio) + model.outputPrice * outputRatio, 3);
}

/** Wall-clock estimate for generating `tokens` output, including first-token wait. */
export function estimateLatency(model: Model, tokens: number): number {
  return Math.round(model.latencyMs + (tokens / model.throughput) * 1000);
}
