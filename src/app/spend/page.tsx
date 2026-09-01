"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Delta, StatLabel, StatValue } from "@/components/ui/stat";
import { Donut } from "@/components/charts/donut";
import { BarChart, BreakdownBars } from "@/components/charts/bar-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { BudgetCard } from "@/features/spending/budget-card";
import { SpendTabs } from "@/features/spending/spend-tabs";
import { allVerdicts, routingSummary } from "@/lib/analytics/verdicts";
import { TASK_TYPES } from "@/lib/data/seed/duels";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { TransactionsTable } from "@/features/spending/transactions-table";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  budgetStatus,
  byCategory,
  byKind,
  byProject,
  byProvider,
  percentChange,
  previousRange,
  rangeGrain,
  spendSeries,
  total,
  withinRange,
  type RangeKey,
} from "@/lib/analytics/spend";
import { PROVIDERS } from "@/lib/data/seed/providers";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { monthKey } from "@/lib/utils/date";

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "3m", label: "3 months" },
  { value: "12m", label: "12 months" },
];

export default function SpendingPage() {
  const { workspace, ready } = useWorkspace();
  const [range, setRange] = useState<RangeKey>("30d");
  const [stackBy, setStackBy] = useState<"kind" | "provider">("kind");
  const now = useMemo(() => new Date(), []);

  const data = useMemo(() => {
    if (!workspace) return null;
    const entries = workspace.spend;
    const current = withinRange(entries, range, now);
    const previous = previousRange(entries, range, now);
    const kinds = byKind(current);

    const providerRows = byProvider(
      current,
      (id) => PROVIDERS[id].name,
      (id) => PROVIDERS[id].series,
    );

    // Monthly totals for the last 12 months, for the "biggest month" callout.
    const monthly = spendSeries(entries, "12m", now);

    return {
      current,
      totalNow: total(current),
      delta: percentChange(total(current), total(previous)),
      kinds,
      series: spendSeries(entries, range, now),
      providerRows,
      projectRows: byProject(current, workspace.projects),
      categoryRows: byCategory(current),
      budget: budgetStatus(entries, workspace.preferences.monthlyBudget, now),
      monthly,
      tokens: current.reduce((sum, e) => sum + (e.tokensIn ?? 0) + (e.tokensOut ?? 0), 0),
      biggestMonth: [...monthly].sort((a, b) => b.value - a.value)[0],
      lifetime: total(entries),
      routing: routingSummary(
        allVerdicts(workspace.duels, workspace.models, workspace.taskProfiles, TASK_TYPES),
      ),
    };
  }, [workspace, range, now]);

  const providerSeriesKeys = useMemo(
    () => (data ? data.providerRows.slice(0, 6).map((row) => row.key) : []),
    [data],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Spending"
        description="Where the money goes, what it is on track to become, and how much of it your own evidence says is avoidable."
        actions={
          <Segmented
            ariaLabel="Time range"
            value={range}
            onChange={setRange}
            options={RANGE_OPTIONS}
          />
        }
      />

      <SpendTabs />

      {!ready || !data ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          {/* The bridge between money and evidence. */}
          {data.routing.actionableSaving > 0 && (
            <Link
              href="/verdicts"
              className="group mt-4 flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-4 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-accent-line hover:shadow-md sm:flex-row sm:items-center"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-accent-line/60 bg-accent-soft text-accent">
                <TrendingUp className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-ink">
                  {formatCurrency(data.routing.actionableSaving, { maximumFractionDigits: 0 })} a
                  month of this is avoidable
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">
                  Across {data.routing.actionable.length} kind
                  {data.routing.actionable.length === 1 ? "" : "s"} of work where a cheaper model
                  already won your own head-to-heads. This is not a generic benchmark — it is your
                  record.
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-accent">
                See the routing table
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}

          <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-4">
            <div className="flex flex-col rounded-xl border border-line bg-surface-1 p-4 shadow-xs">
              <StatLabel>Total, {RANGE_OPTIONS.find((r) => r.value === range)?.label}</StatLabel>
              <StatValue className="mt-1.5">
                {formatCurrency(data.totalNow, { maximumFractionDigits: 0 })}
              </StatValue>
              <div className="mt-1.5 flex items-center gap-2">
                <Delta value={data.delta} inverted />
                <span className="text-[11.5px] text-ink-3">vs the previous window</span>
              </div>
              <p className="mt-auto border-t border-line-subtle pt-2.5 text-[11.5px] text-ink-3">
                <span className="font-mono font-medium tabular-nums text-ink">
                  {formatNumber(data.tokens / 1_000_000, 1)}M
                </span>{" "}
                tokens billed in this window
              </p>
            </div>

            <div className="flex flex-col rounded-xl border border-line bg-surface-1 p-4 shadow-xs">
              <StatLabel>Subscriptions</StatLabel>
              <StatValue className="mt-1.5">
                {formatCurrency(data.kinds.subscription + data.kinds["one-off"], {
                  maximumFractionDigits: 0,
                })}
              </StatValue>
              <p className="mt-1.5 text-[11.5px] text-ink-3">
                {data.totalNow > 0
                  ? `${Math.round(((data.kinds.subscription + data.kinds["one-off"]) / data.totalNow) * 100)}% of the window`
                  : "—"}
              </p>
              <p className="mt-auto border-t border-line-subtle pt-2.5 text-[11.5px] text-ink-3">
                Fixed cost you pay whether or not you open the app
              </p>
            </div>

            <div className="flex flex-col rounded-xl border border-line bg-surface-1 p-4 shadow-xs">
              <StatLabel>Usage</StatLabel>
              <StatValue className="mt-1.5">
                {formatCurrency(data.kinds.usage, { maximumFractionDigits: 0 })}
              </StatValue>
              <p className="mt-1.5 text-[11.5px] text-ink-3">
                {data.totalNow > 0
                  ? `${Math.round((data.kinds.usage / data.totalNow) * 100)}% of the window`
                  : "—"}
              </p>
              <p className="mt-auto border-t border-line-subtle pt-2.5 text-[11.5px] text-ink-3">
                Scales with what you actually run
              </p>
            </div>

            <BudgetCard status={data.budget} />
          </div>

          {/* Trend */}
          <Card className="mt-4">
            <CardHeader>
              <div>
                <CardTitle>Spend over time</CardTitle>
                <p className="mt-0.5 text-xs text-ink-3">
                  {data.biggestMonth && (
                    <>
                      Highest month in the last year:{" "}
                      <span className="font-medium text-ink">{data.biggestMonth.label}</span> at{" "}
                      <span className="font-mono font-medium tabular-nums text-ink">
                        {formatCurrency(data.biggestMonth.value, { maximumFractionDigits: 0 })}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <Segmented
                ariaLabel="Stack by"
                size="sm"
                value={stackBy}
                onChange={setStackBy}
                options={[
                  { value: "kind", label: "By type" },
                  { value: "provider", label: "By provider" },
                ]}
              />
            </CardHeader>
            <div className="p-4 pt-3">
              {stackBy === "kind" ? (
                <TrendChart
                  height={260}
                  smooth={rangeGrain(range) !== "day"}
                  ariaLabel="Spend over time by type"
                  data={data.series.map((point) => ({
                    label: point.label,
                    values: {
                      usage: point.parts.usage,
                      subscription: point.parts.subscription + point.parts["one-off"],
                    },
                  }))}
                  series={[
                    { key: "usage", label: "Usage", color: "var(--series-2)" },
                    { key: "subscription", label: "Subscriptions", color: "var(--series-1)" },
                  ]}
                />
              ) : (
                <ProviderTrend
                  entries={workspace!.spend}
                  range={range}
                  now={now}
                  providerKeys={providerSeriesKeys}
                />
              )}
            </div>
          </Card>

          {/* Breakdowns */}
          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>By provider</CardTitle>
              </CardHeader>
              <div className="flex flex-col items-center gap-4 p-4 sm:flex-row lg:flex-col">
                <Donut
                  slices={data.providerRows.slice(0, 7).map((row) => ({
                    key: row.key,
                    label: row.label,
                    value: row.value,
                    color: `var(--series-${row.series})`,
                  }))}
                  centerValue={formatCurrency(data.totalNow, { maximumFractionDigits: 0 })}
                  centerLabel="total"
                />
                <ul className="w-full min-w-0 space-y-1">
                  {data.providerRows.slice(0, 7).map((row) => (
                    <li key={row.key} className="flex items-center gap-2 text-[12px]">
                      <span
                        className="size-1.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: `var(--series-${row.series})` }}
                      />
                      <span className="min-w-0 flex-1 truncate text-ink-2">{row.label}</span>
                      <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink-4">
                        {row.share}%
                      </span>
                      <span className="w-14 shrink-0 text-right font-mono text-[11.5px] tabular-nums text-ink">
                        {formatCurrency(row.value, { maximumFractionDigits: 0 })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>By project</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {(() => {
                      const unassigned = data.projectRows.find((r) => r.key === "__unassigned");
                      const attributed = data.totalNow - (unassigned?.value ?? 0);
                      const pct = data.totalNow > 0 ? (attributed / data.totalNow) * 100 : 0;
                      return `${Math.round(pct)}% of spend is attributed`;
                    })()}
                  </p>
                </div>
              </CardHeader>
              <div className="p-4">
                <BreakdownBars
                  data={data.projectRows.map((row) => ({
                    key: row.key,
                    label: row.label,
                    value: row.value,
                    color:
                      row.key === "__unassigned"
                        ? "var(--ink-4)"
                        : `var(--series-${row.series})`,
                  }))}
                />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By category</CardTitle>
              </CardHeader>
              <div className="p-4">
                <BarChart
                  height={200}
                  ariaLabel="Spend by category"
                  data={data.categoryRows.map((row) => ({
                    key: row.key,
                    label: row.label.length > 9 ? `${row.label.slice(0, 8)}…` : row.label,
                    value: row.value,
                    color: `var(--series-${row.series})`,
                  }))}
                />
              </div>
            </Card>
          </div>

          <div className="mt-4">
            <TransactionsTable
              entries={data.current}
              projects={workspace!.projects}
              tools={workspace!.tools}
            />
          </div>

          <p className="mt-4 text-[11.5px] text-ink-4">
            Lifetime tracked spend {formatCurrency(data.lifetime, { maximumFractionDigits: 0 })} ·
            current month {monthKey(now)}
          </p>
        </>
      )}
    </PageContainer>
  );
}

/** Stacked provider view — split out so the heavy grouping only runs when shown. */
function ProviderTrend({
  entries,
  range,
  now,
  providerKeys,
}: {
  entries: import("@/lib/data/types").SpendEntry[];
  range: RangeKey;
  now: Date;
  providerKeys: string[];
}) {
  const data = useMemo(() => {
    const buckets = spendSeries(entries, range, now);
    const keySet = new Set(providerKeys);
    const perProvider = new Map<string, Map<string, number>>();

    for (const entry of withinRange(entries, range, now)) {
      const key = keySet.has(entry.provider) ? entry.provider : "other";
      const grain = rangeGrain(range);
      const bucketKey =
        grain === "month"
          ? entry.date.slice(0, 7)
          : grain === "day"
            ? entry.date
            : (buckets.find((b) => b.key >= entry.date)?.key ?? buckets[buckets.length - 1]?.key);
      if (!bucketKey) continue;
      const row = perProvider.get(bucketKey) ?? new Map<string, number>();
      row.set(key, (row.get(key) ?? 0) + entry.amount);
      perProvider.set(bucketKey, row);
    }

    return buckets.map((bucket) => ({
      label: bucket.label,
      values: Object.fromEntries(
        [...providerKeys, "other"].map((key) => [key, perProvider.get(bucket.key)?.get(key) ?? 0]),
      ),
    }));
  }, [entries, range, now, providerKeys]);

  const series = [...providerKeys, "other"].map((key) => ({
    key,
    label: key === "other" ? "Other" : PROVIDERS[key as keyof typeof PROVIDERS].name,
    color:
      key === "other"
        ? "var(--series-8)"
        : `var(--series-${PROVIDERS[key as keyof typeof PROVIDERS].series})`,
  }));

  return (
    <TrendChart
      height={260}
      smooth={rangeGrain(range) !== "day"}
      ariaLabel="Spend over time by provider"
      data={data}
      series={series}
    />
  );
}
