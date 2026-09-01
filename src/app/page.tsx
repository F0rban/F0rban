"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Play, Star } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { TrendChart } from "@/components/charts/trend-chart";
import { KpiSkeleton, KpiTile } from "@/features/dashboard/kpi-tile";
import { AttentionPanel } from "@/features/dashboard/attention-panel";
import { ActivityFeed } from "@/features/dashboard/activity-feed";
import { QuickActions } from "@/features/dashboard/quick-actions";
import { ProjectStrip } from "@/features/dashboard/project-strip";
import { useWorkspace } from "@/hooks/use-workspace";
import { dashboardSummary, deriveAttention } from "@/lib/analytics/attention";
import {
  budgetStatus,
  monthToDatePace,
  percentChange,
  previousRange,
  rangeGrain,
  spendSeries,
  total,
  trailing,
  withinRange,
  type RangeKey,
} from "@/lib/analytics/spend";
import { formatCurrency, formatNumber, pluralize } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";

function greeting(hour: number): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { workspace, ready } = useWorkspace();
  const [range, setRange] = useState<RangeKey>("30d");
  const now = useMemo(() => new Date(), []);

  const data = useMemo(() => {
    if (!workspace) return null;

    const summary = dashboardSummary(workspace, now);
    const attention = deriveAttention(workspace, now);
    const budget = budgetStatus(workspace.spend, workspace.preferences.monthlyBudget, now);
    const pace = monthToDatePace(workspace.spend, now);
    const trailing30 = trailing(workspace.spend, 30, now);

    const current = withinRange(workspace.spend, range, now);
    const previous = previousRange(workspace.spend, range, now);
    const series = spendSeries(workspace.spend, range, now);

    const usageDelta = percentChange(
      total(current.filter((e) => e.kind === "usage")),
      total(previous.filter((e) => e.kind === "usage")),
    );

    const dailySpark = spendSeries(workspace.spend, "30d", now).map((p) => p.value);

    const runSpark = (() => {
      const buckets = new Array(14).fill(0);
      for (const event of workspace.activity) {
        if (event.kind !== "prompt.run") continue;
        const daysAgo = Math.floor((now.getTime() - new Date(event.at).getTime()) / 86_400_000);
        if (daysAgo >= 0 && daysAgo < 14) buckets[13 - daysAgo] += 1;
      }
      return buckets;
    })();

    return {
      summary,
      attention,
      budget,
      pace,
      trailing30,
      series,
      rangeTotal: total(current),
      rangeDelta: percentChange(total(current), total(previous)),
      usageDelta,
      dailySpark,
      runSpark,
      activeProjects: workspace.projects
        .filter((p) => p.status === "active" || p.status === "planning")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recentPrompts: [...workspace.prompts]
        .filter((p) => p.lastUsedAt)
        .sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""))
        .slice(0, 5),
    };
  }, [workspace, range, now]);

  const name = workspace?.preferences.displayName?.trim();

  return (
    <PageContainer>
      <PageHeader
        title={name ? `${greeting(now.getHours())}, ${name}` : greeting(now.getHours())}
        description={
          data
            ? `${pluralize(data.summary.activeToolCount, "active tool")} · ${pluralize(data.summary.activeProjects, "active project")} · ${formatCurrency(data.trailing30, { maximumFractionDigits: 0 })} in the last 30 days`
            : "Loading your workspace…"
        }
        actions={
          <>
            <Button size="sm" asChild>
              <Link href="/spending">
                Spending
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/prompts">
                <Play className="size-3.5" />
                Run a prompt
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {!ready || !data ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiTile
              label="Spend this month"
              value={formatCurrency(data.summary.monthToDate, { maximumFractionDigits: 0 })}
              delta={data.pace.delta}
              deltaInverted
              sub="vs last month"
              spark={data.dailySpark}
              sparkColor={
                data.budget.state === "over"
                  ? "var(--negative)"
                  : data.budget.state === "watch"
                    ? "var(--warning)"
                    : "var(--accent)"
              }
              href="/spending"
              footer={
                <p className="text-[11.5px] text-ink-3">
                  Forecast{" "}
                  <span
                    className={`font-mono font-medium tabular-nums ${
                      data.budget.state === "over" ? "text-negative" : "text-ink"
                    }`}
                  >
                    {formatCurrency(data.budget.forecast, { maximumFractionDigits: 0 })}
                  </span>{" "}
                  by month end · {data.budget.daysLeft} days left
                </p>
              }
            />

            <KpiTile
              label="Fixed subscriptions"
              value={formatCurrency(data.summary.fixedMonthly, { maximumFractionDigits: 0 })}
              sub="per month, before usage"
              href="/tools"
              footer={
                <p className="text-[11.5px] text-ink-3">
                  <span className="font-mono font-medium tabular-nums text-ink">
                    {data.summary.activeToolCount}
                  </span>{" "}
                  active of {data.summary.totalToolCount} tracked
                </p>
              }
            />

            <KpiTile
              label="API usage"
              value={formatCurrency(data.summary.usageThisMonth, { maximumFractionDigits: 0 })}
              delta={data.usageDelta}
              deltaInverted
              sub="this month"
              href="/spending"
              footer={
                <p className="text-[11.5px] text-ink-3">
                  Across{" "}
                  <span className="font-mono font-medium tabular-nums text-ink">
                    {data.summary.modelsInUse}
                  </span>{" "}
                  models in active use
                </p>
              }
            />

            <KpiTile
              label="Prompt runs"
              value={formatNumber(data.summary.promptRuns)}
              sub="last 30 days"
              spark={data.runSpark}
              sparkColor="var(--series-2)"
              href="/prompts"
              footer={
                <p className="text-[11.5px] text-ink-3">
                  <span className="font-mono font-medium tabular-nums text-ink">
                    {workspace?.prompts.length ?? 0}
                  </span>{" "}
                  prompts in the vault
                </p>
              }
            />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Spend over time</CardTitle>
                <p className="mt-0.5 text-xs text-ink-3">
                  {data ? (
                    <>
                      <span className="font-mono font-medium tabular-nums text-ink">
                        {formatCurrency(data.rangeTotal)}
                      </span>{" "}
                      in this window
                      {data.rangeDelta !== null && (
                        <>
                          {" · "}
                          <span
                            className={
                              data.rangeDelta > 0 ? "text-negative" : "text-positive"
                            }
                          >
                            {data.rangeDelta > 0 ? "+" : ""}
                            {data.rangeDelta}%
                          </span>{" "}
                          vs the one before
                        </>
                      )}
                    </>
                  ) : (
                    "Subscriptions and usage, stacked"
                  )}
                </p>
              </div>
              <Segmented
                ariaLabel="Time range"
                size="sm"
                value={range}
                onChange={setRange}
                options={[
                  { value: "7d", label: "7D" },
                  { value: "30d", label: "30D" },
                  { value: "3m", label: "3M" },
                  { value: "12m", label: "12M" },
                ]}
              />
            </CardHeader>
            <div className="p-4 pt-3">
              {!ready || !data ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <TrendChart
                  ariaLabel="Spend over time, subscriptions and usage"
                  smooth={rangeGrain(range) !== "day"}
                  data={data.series.map((point) => ({
                    label: point.label,
                    values: {
                      subscription: point.parts.subscription + point.parts["one-off"],
                      usage: point.parts.usage,
                    },
                  }))}
                  series={[
                    { key: "usage", label: "Usage", color: "var(--series-2)" },
                    { key: "subscription", label: "Subscriptions", color: "var(--series-1)" },
                  ]}
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Active projects</CardTitle>
                <p className="mt-0.5 text-xs text-ink-3">Task progress and spend over the last 30 days</p>
              </div>
              <Button variant="ghost" size="xs" asChild>
                <Link href="/projects">
                  All projects
                  <ArrowRight className="size-3" />
                </Link>
              </Button>
            </CardHeader>
            {!ready || !data ? (
              <div className="space-y-3 p-4">
                <SkeletonText lines={4} />
              </div>
            ) : (
              <ProjectStrip projects={data.activeProjects} spend={workspace!.spend} now={now} />
            )}
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recently used prompts</CardTitle>
                <p className="mt-0.5 text-xs text-ink-3">Jump straight back into one</p>
              </div>
              <Button variant="ghost" size="xs" asChild>
                <Link href="/prompts">
                  Prompt Vault
                  <ArrowRight className="size-3" />
                </Link>
              </Button>
            </CardHeader>
            {!ready || !data ? (
              <div className="p-4">
                <SkeletonText lines={4} />
              </div>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {data.recentPrompts.map((prompt) => (
                  <li key={prompt.id}>
                    <Link
                      href={`/prompts?prompt=${prompt.id}`}
                      className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2/60"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[12.5px] font-medium text-ink-2 transition-colors group-hover:text-ink">
                            {prompt.title}
                          </span>
                          {prompt.favorite && (
                            <Star className="size-3 shrink-0 fill-accent text-accent" />
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-ink-4">
                          {prompt.description}
                        </span>
                      </span>
                      {prompt.variables.length > 0 && (
                        <Badge tone="outline" className="hidden sm:inline-flex">
                          {prompt.variables.length} vars
                        </Badge>
                      )}
                      <span className="w-16 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-ink-4">
                        {relativeTime(prompt.lastUsedAt, now)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <QuickActions workspace={workspace} />

          {!ready || !data ? (
            <Card className="p-4">
              <SkeletonText lines={5} />
            </Card>
          ) : (
            <AttentionPanel items={data.attention} />
          )}

          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Activity</CardTitle>
                <p className="mt-0.5 text-xs text-ink-3">Everything that ran, in order</p>
              </div>
            </CardHeader>
            {!ready || !workspace ? (
              <div className="p-4">
                <SkeletonText lines={6} />
              </div>
            ) : (
              <div className="max-h-[32rem] overflow-y-auto">
                <ActivityFeed events={workspace.activity} limit={18} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
