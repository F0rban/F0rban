import { describe, expect, it } from "vitest";
import {
  RANGES,
  blendedRate,
  budgetStatus,
  byCategory,
  byKind,
  byProject,
  byProvider,
  estimateCost,
  estimateLatency,
  forecastMonthEnd,
  monthToDate,
  monthToDatePace,
  percentChange,
  previousRange,
  rangeGrain,
  round,
  spendSeries,
  total,
  trailing,
  withinRange,
} from "./spend";
import type { Model, Project, SpendEntry } from "../data/types";
import { toDayKey } from "../utils/date";
import { addDays } from "../utils/date";

const NOW = new Date(2026, 4, 20, 12, 0, 0); // 20 May 2026

function entry(partial: Partial<SpendEntry> & { date: string; amount: number }): SpendEntry {
  return {
    id: Math.random().toString(36).slice(2),
    provider: "anthropic",
    toolId: null,
    projectId: null,
    modelId: null,
    category: "api",
    kind: "usage",
    description: "Test",
    tokensIn: null,
    tokensOut: null,
    ...partial,
  };
}

const day = (offset: number) => toDayKey(addDays(NOW, offset));

describe("round", () => {
  it("rounds to two decimals by default", () => {
    expect(round(2.344)).toBe(2.34);
    expect(round(2.345)).toBe(2.35);
  });

  it("rounds the decimal the user sees, not its binary approximation", () => {
    // 1.005 * 100 is 100.49999999999999 in IEEE-754.
    expect(round(1.005)).toBe(1.01);
    expect(round(8.075)).toBe(8.08);
  });

  it("rounds negatives symmetrically, so credits do not drift", () => {
    expect(round(-1.005)).toBe(-1.01);
  });

  it("honours an explicit precision", () => {
    expect(round(0.123456, 4)).toBe(0.1235);
  });
});

describe("withinRange", () => {
  const entries = [
    entry({ date: day(0), amount: 10 }),
    entry({ date: day(-6), amount: 20 }),
    entry({ date: day(-7), amount: 40 }),
    entry({ date: day(-29), amount: 80 }),
    entry({ date: day(-400), amount: 160 }),
  ];

  it("includes today and excludes the day before the window opens", () => {
    const seven = withinRange(entries, "7d", NOW);
    expect(total(seven)).toBe(30);
  });

  it("widens with the range", () => {
    expect(total(withinRange(entries, "30d", NOW))).toBe(150);
    expect(total(withinRange(entries, "12m", NOW))).toBe(150);
  });

  it("never counts a future-dated entry", () => {
    const withFuture = [...entries, entry({ date: day(3), amount: 999 })];
    expect(total(withinRange(withFuture, "30d", NOW))).toBe(150);
  });
});

describe("previousRange", () => {
  it("selects the window immediately before the current one, without overlap", () => {
    const entries = [
      entry({ date: day(-3), amount: 10 }),
      entry({ date: day(-10), amount: 25 }),
    ];
    expect(total(withinRange(entries, "7d", NOW))).toBe(10);
    expect(total(previousRange(entries, "7d", NOW))).toBe(25);
  });
});

describe("trailing", () => {
  it("sums a rolling window inclusive of today", () => {
    const entries = [
      entry({ date: day(0), amount: 5 }),
      entry({ date: day(-29), amount: 5 }),
      entry({ date: day(-30), amount: 100 }),
    ];
    expect(trailing(entries, 30, NOW)).toBe(10);
  });
});

describe("spendSeries", () => {
  it("emits one bucket per day for a 30-day range, including empty days", () => {
    const series = spendSeries([entry({ date: day(-2), amount: 12 })], "30d", NOW);
    expect(series).toHaveLength(30);
    expect(total([]) + series.reduce((sum, p) => sum + p.value, 0)).toBe(12);
    expect(series.filter((p) => p.value > 0)).toHaveLength(1);
  });

  it("emits twelve monthly buckets for the 12m range", () => {
    expect(spendSeries([], "12m", NOW)).toHaveLength(12);
  });

  it("splits each bucket by kind so a stacked chart needs no second pass", () => {
    const series = spendSeries(
      [
        entry({ date: day(-1), amount: 30, kind: "subscription" }),
        entry({ date: day(-1), amount: 7, kind: "usage" }),
      ],
      "7d",
      NOW,
    );
    const bucket = series.find((p) => p.value > 0)!;
    expect(bucket.parts.subscription).toBe(30);
    expect(bucket.parts.usage).toBe(7);
    expect(bucket.value).toBe(37);
  });

  it("uses the grain declared for each range", () => {
    expect(rangeGrain("7d")).toBe("day");
    expect(rangeGrain("3m")).toBe("week");
    expect(rangeGrain("12m")).toBe("month");
    expect(RANGES).toHaveLength(4);
  });
});

describe("breakdowns", () => {
  const entries = [
    entry({ date: day(-1), amount: 60, provider: "anthropic", projectId: "p1", category: "api" }),
    entry({ date: day(-1), amount: 40, provider: "openai", projectId: "p2", category: "coding" }),
    entry({ date: day(-1), amount: 100, provider: "anthropic", projectId: null, category: "api" }),
  ];

  it("groups by provider, sorted by value, with shares that sum to 100", () => {
    const rows = byProvider(entries, (id) => id, () => 1);
    expect(rows[0]!.key).toBe("anthropic");
    expect(rows[0]!.value).toBe(160);
    expect(rows.reduce((sum, r) => sum + r.share, 0)).toBeCloseTo(100, 1);
  });

  it("labels unattributed spend rather than dropping it", () => {
    const projects = [
      { id: "p1", name: "Atlas", series: 1 } as Project,
      { id: "p2", name: "Signal", series: 2 } as Project,
    ];
    const rows = byProject(entries, projects);
    expect(rows.find((r) => r.key === "__unassigned")?.value).toBe(100);
    expect(rows.find((r) => r.key === "p1")?.label).toBe("Atlas");
  });

  it("groups by category with human labels", () => {
    const rows = byCategory(entries);
    expect(rows[0]!.label).toBe("API usage");
    expect(rows[0]!.value).toBe(160);
  });

  it("splits totals by kind", () => {
    const kinds = byKind([
      entry({ date: day(0), amount: 10, kind: "usage" }),
      entry({ date: day(0), amount: 20, kind: "subscription" }),
      entry({ date: day(0), amount: -5, kind: "credit" }),
    ]);
    expect(kinds.usage).toBe(10);
    expect(kinds.subscription).toBe(20);
    expect(kinds.credit).toBe(-5);
  });
});

describe("monthToDate and pace", () => {
  const entries = [
    entry({ date: "2026-05-01", amount: 10 }),
    entry({ date: "2026-05-20", amount: 15 }),
    entry({ date: "2026-04-01", amount: 30 }),
    entry({ date: "2026-04-25", amount: 70 }),
  ];

  it("counts only the current calendar month", () => {
    expect(monthToDate(entries, NOW)).toBe(25);
  });

  it("compares like for like: day 1..N of both months", () => {
    const pace = monthToDatePace(entries, NOW);
    expect(pace.current).toBe(25);
    // Only the 1 April entry falls on or before day 20.
    expect(pace.previous).toBe(30);
    expect(pace.delta).toBeCloseTo(-16.7, 1);
  });
});

describe("forecastMonthEnd", () => {
  it("extrapolates recent usage across the remaining days", () => {
    // $2/day for the trailing fortnight, 11 days left in May.
    const entries = Array.from({ length: 14 }, (_, i) =>
      entry({ date: toDayKey(addDays(NOW, -i)), amount: 2, kind: "usage" }),
    );
    const forecast = forecastMonthEnd(entries, NOW);
    const mtd = monthToDate(entries, NOW);
    expect(forecast).toBeGreaterThan(mtd);
    expect(forecast).toBeCloseTo(mtd + 2 * 11, 0);
  });

  it("adds subscription renewals that have not billed yet this month", () => {
    const entries = [
      // Billed on the 28th last month, so it has not billed yet this month.
      entry({ date: "2026-04-28", amount: 40, kind: "subscription", toolId: "t-x" }),
    ];
    expect(forecastMonthEnd(entries, NOW)).toBe(40);
  });

  it("does not double-count a subscription that already billed this month", () => {
    const entries = [
      entry({ date: "2026-04-28", amount: 40, kind: "subscription", toolId: "t-x" }),
      entry({ date: "2026-05-28", amount: 40, kind: "subscription", toolId: "t-x" }),
    ];
    // The May charge is in the future relative to the 20th, so MTD excludes it,
    // and the upcoming-renewal pass must not add it a second time.
    const forecast = forecastMonthEnd(entries, NOW);
    expect(forecast).toBeLessThanOrEqual(40);
  });

  it("returns month-to-date on the last day of the month", () => {
    const lastDay = new Date(2026, 4, 31, 12);
    const entries = [entry({ date: "2026-05-10", amount: 12 })];
    expect(forecastMonthEnd(entries, lastDay)).toBe(12);
  });
});

describe("budgetStatus", () => {
  const spend = [entry({ date: "2026-05-05", amount: 100, kind: "subscription" })];

  it("reports healthy when the forecast stays under the ceiling", () => {
    const status = budgetStatus(spend, 400, NOW);
    expect(status.state).toBe("healthy");
    expect(status.spent).toBe(100);
    expect(status.usedPct).toBe(25);
    expect(status.remaining).toBe(300);
  });

  it("flags over when the forecast exceeds the ceiling", () => {
    const status = budgetStatus(spend, 50, NOW);
    expect(status.state).toBe("over");
    expect(status.remaining).toBe(-50);
  });

  it("computes a safe daily rate for the days that remain", () => {
    const status = budgetStatus(spend, 400, NOW);
    expect(status.daysLeft).toBe(11);
    expect(status.safeDailyRate).toBeCloseTo(300 / 11, 1);
  });

  it("never suggests a negative daily rate", () => {
    expect(budgetStatus(spend, 10, NOW).safeDailyRate).toBe(0);
  });
});

describe("percentChange", () => {
  it("computes a signed percentage", () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(80, 100)).toBe(-20);
  });

  it("returns null rather than Infinity when the base is zero", () => {
    expect(percentChange(50, 0)).toBeNull();
    expect(percentChange(0, 0)).toBe(0);
  });
});

describe("model cost estimation", () => {
  const model: Model = {
    id: "m",
    name: "Test",
    provider: "anthropic",
    family: "Test",
    releasedAt: "2026-01-01",
    knowledgeCutoff: "Jan 2026",
    contextWindow: 200_000,
    maxOutput: 8_000,
    inputPrice: 3,
    outputPrice: 15,
    throughput: 100,
    latencyMs: 500,
    modalities: ["text"],
    scores: { reasoning: 80, coding: 80, creativity: 80, speed: 80, instruction: 80 },
    openWeights: false,
    personalScore: 8,
    notes: "",
    favorite: false,
    tags: [],
  };

  it("prices a request from input and output tokens separately", () => {
    const estimate = estimateCost(model, { tokensIn: 1_000_000, tokensOut: 1_000_000, requestsPerDay: 1 });
    expect(estimate.perRequest).toBe(18);
    expect(estimate.inputShare).toBeCloseTo(16.7, 1);
  });

  it("scales to a 30-day month", () => {
    // 1k in at $3/M plus 1k out at $15/M is $0.018 a request.
    const estimate = estimateCost(model, { tokensIn: 1000, tokensOut: 1000, requestsPerDay: 100 });
    expect(estimate.perRequest).toBeCloseTo(0.018, 6);
    expect(estimate.perDay).toBeCloseTo(1.8, 4);
    expect(estimate.perMonth).toBeCloseTo(54, 2);
  });

  it("handles a zero-token request without dividing by zero", () => {
    const estimate = estimateCost(model, { tokensIn: 0, tokensOut: 0, requestsPerDay: 10 });
    expect(estimate.perRequest).toBe(0);
    expect(estimate.inputShare).toBe(0);
  });

  it("blends input and output at the given output ratio", () => {
    expect(blendedRate(model, 0.25)).toBe(6);
    expect(blendedRate(model, 0)).toBe(3);
    expect(blendedRate(model, 1)).toBe(15);
  });

  it("includes time-to-first-token in the latency estimate", () => {
    expect(estimateLatency(model, 100)).toBe(1500);
  });
});
