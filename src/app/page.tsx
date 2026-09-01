"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  EqualApproximately,
  Gavel,
  Repeat2,
  Sparkles,
  Swords,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SampleBanner } from "@/components/layout/sample-banner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ProviderMark } from "@/components/ui/provider-mark";
import { RecordScore, TallyMarks } from "@/components/ui/record";
import { ActivityFeed } from "@/features/dashboard/activity-feed";
import { ModelSwap } from "@/features/verdicts/verdict-parts";
import { useWorkspace } from "@/hooks/use-workspace";
import { allVerdicts, evidenceCoverage, routingSummary } from "@/lib/analytics/verdicts";
import { evidenceMode } from "@/lib/analytics/evidence";
import { budgetStatus } from "@/lib/analytics/spend";
import { TASK_LABEL, TASK_TYPES } from "@/lib/data/seed/duels";
import { formatCurrency, pluralize } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

function greeting(hour: number): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Today.
 *
 * Not a dashboard of everything — a single question ("what needs judging?") and
 * a single answer ("here is what your evidence now says"). The loop is the
 * page: judge what is waiting, read what changed, act on it.
 */
export default function TodayPage() {
  const { workspace, ready } = useWorkspace();
  const now = useMemo(() => new Date(), []);

  const data = useMemo(() => {
    if (!workspace) return null;
    const verdicts = allVerdicts(
      workspace.duels,
      workspace.models,
      workspace.taskProfiles,
      TASK_TYPES,
    );
    const summary = routingSummary(verdicts);
    const models = new Map(workspace.models.map((m) => [m.id, m]));
    return {
      verdicts,
      summary,
      models,
      coverage: evidenceCoverage(verdicts),
      pending: workspace.duels.filter((d) => d.status === "pending"),
      recent: workspace.duels
        .filter((d) => d.status === "decided")
        .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""))
        .slice(0, 5),
      reversals: verdicts.filter((v) => v.reversal),
      budget: budgetStatus(workspace.spend, workspace.preferences.monthlyBudget, now),
    };
  }, [workspace, now]);

  const name = workspace?.preferences.displayName?.trim();
  // Every "your" on this page has to be earned. Until the user's first own
  // duel, the record on screen belongs to the worked example, and says so.
  const example = workspace ? evidenceMode(workspace) === "example" : false;

  return (
    <PageContainer>
      <PageHeader
        title={name ? `${greeting(now.getHours())}, ${name}` : greeting(now.getHours())}
        description={
          data
            ? `${pluralize(data.coverage.totalDuels, "duel")} judged · ${data.coverage.covered} of ${data.coverage.total} task types settled`
            : "Loading your record…"
        }
        actions={
          <Button variant="primary" size="sm" asChild>
            <Link href="/duels/new">
              <Swords className="size-3.5" />
              Run a duel
            </Link>
          </Button>
        }
      />

      <SampleBanner className="mt-4" />

      {!ready || !data ? (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* The headline. One number, and the way to act on it. */}
          <Link
            href="/verdicts"
            className={cn(
              "group mt-5 flex flex-col gap-4 rounded-xl border border-line bg-surface-1 p-5 shadow-xs",
              "transition-[border-color,box-shadow] duration-200 hover:border-accent-line hover:shadow-md",
              "sm:flex-row sm:items-center",
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-accent-line/60 bg-accent-soft text-accent">
              <TrendingUp className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-balance text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink sm:text-[21px]">
                {example ? "In this worked example, the record says the habit overpays by" : "Your own results say you are overpaying by"}{" "}
                <span className="text-positive">
                  {formatCurrency(data.summary.actionableSaving, { maximumFractionDigits: 0 })}
                </span>{" "}
                a month.
              </span>
              <span className="mt-1.5 block text-[12.5px] leading-relaxed text-ink-3">
                Across {data.summary.actionable.length} kind
                {data.summary.actionable.length === 1 ? "" : "s"} of work where a cheaper model
                already won {example ? "the sample" : "your"} head-to-heads. That is{" "}
                {formatCurrency(data.summary.actionableSaving * 12, { maximumFractionDigits: 0 })} a
                year, out of {formatCurrency(data.summary.currentMonthlyCost)} routed today.
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-accent">
              See the routing table
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </Link>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 space-y-4 lg:col-span-2">
              {/* The one thing the product asks of you. */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Waiting for a verdict</CardTitle>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {data.pending.length === 0
                        ? "Nothing to judge. Run a duel next time a model choice matters."
                        : "Names and prices stay hidden until you pick."}
                    </p>
                  </div>
                  {data.pending.length > 0 && <Badge tone="accent" dot>{data.pending.length}</Badge>}
                </CardHeader>

                {data.pending.length === 0 ? (
                  <div className="flex items-center gap-3 px-4 py-5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-ink-4">
                      <Gavel className="size-4" />
                    </span>
                    <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink-3">
                      Your record only grows when you run comparisons. The next time you are about to
                      pick a model, run it as a duel instead.
                    </p>
                    <Button variant="secondary" size="sm" asChild className="shrink-0">
                      <Link href="/duels/new">Run one</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-line-subtle">
                    {data.pending.map((duel) => (
                      <li key={duel.id}>
                        <Link
                          href={`/duels/${duel.id}`}
                          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/60"
                        >
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-accent-line bg-accent-soft text-accent">
                            <Gavel className="size-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-medium text-ink">
                              {duel.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-ink-4">
                              {TASK_LABEL[duel.taskType]} · {duel.entries.length} answers ·{" "}
                              {relativeTime(duel.createdAt, now)}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-accent">
                            Judge
                            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* What the evidence changed. */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>
                      {example ? "What the example's evidence says" : "What your evidence says now"}
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-ink-3">
                      The routing changes with the biggest gap between habit and record
                    </p>
                  </div>
                  <Button variant="ghost" size="xs" asChild>
                    <Link href="/verdicts">
                      All verdicts
                      <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <ul className="divide-y divide-line-subtle">
                  {data.summary.actionable.slice(0, 3).map((verdict) => {
                    const leader = verdict.standings[0]!;
                    return (
                      <li key={verdict.taskType}>
                        <Link
                          href="/verdicts"
                          className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/60"
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[12.5px] font-medium text-ink">
                                {TASK_LABEL[verdict.taskType]}
                              </span>
                              <TallyMarks count={leader.wins} label={`${leader.wins} wins`} />
                              <RecordScore
                                wins={leader.wins}
                                losses={leader.losses}
                                ties={verdict.ties}
                                size="sm"
                              />
                            </span>
                            <ModelSwap
                              className="mt-1"
                              from={verdict.currentModelId ? data.models.get(verdict.currentModelId) : undefined}
                              to={verdict.recommendedModelId ? data.models.get(verdict.recommendedModelId) : undefined}
                            />
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-mono text-[14px] font-semibold tabular-nums text-positive">
                              +{formatCurrency(verdict.monthlyDelta, { maximumFractionDigits: 0 })}
                            </span>
                            <span className="block text-[10px] text-ink-4">saved / mo</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}

                  {data.reversals.map((verdict) => (
                    <li key={`rev-${verdict.taskType}`}>
                      <Link
                        href="/verdicts"
                        className="flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-surface-2/60"
                      >
                        <Repeat2 className="mt-0.5 size-3.5 shrink-0 text-warning" />
                        <span className="min-w-0">
                          <span className="block text-[12.5px] font-medium text-ink">
                            {TASK_LABEL[verdict.taskType]} has flipped
                          </span>
                          <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-3">
                            {data.models.get(verdict.reversal!.previousLeaderId)?.name} led on the
                            lifetime record, but{" "}
                            {data.models.get(verdict.reversal!.leaderId)?.name} has won{" "}
                            {verdict.reversal!.recentWins} of the last {verdict.reversal!.recentOf}.
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* The nudge: the product is only as good as its corpus. */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>
                      {example ? "How settled the example record is" : "How settled your record is"}
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {data.coverage.covered} of {data.coverage.total} kinds of work have enough
                      evidence to route on
                    </p>
                  </div>
                </CardHeader>
                <div className="p-4">
                  <Progress
                    value={data.coverage.covered}
                    max={data.coverage.total}
                    label="Task types with a settled verdict"
                  />
                  {/* Evidence count, not win/loss: the question here is how
                      much more judging it takes, not who is ahead. */}
                  <ul className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {data.verdicts
                      .filter((v) => v.confidence === "insufficient" || v.confidence === "emerging")
                      .slice(0, 4)
                      .map((verdict) => (
                        <li key={verdict.taskType}>
                          <Link
                            href={`/duels/new?task=${verdict.taskType}`}
                            className="group flex items-center gap-2.5"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="truncate text-[12px] text-ink-2 transition-colors group-hover:text-ink">
                                  {TASK_LABEL[verdict.taskType]}
                                </span>
                                <TallyMarks
                                  count={verdict.sampleSize}
                                  tone="tie"
                                  label={`${verdict.sampleSize} results so far`}
                                />
                              </span>
                              <span className="mt-1 block text-[10.5px] text-ink-4">
                                {verdict.sampleSize < 5
                                  ? `${5 - verdict.sampleSize} more to get past a guess`
                                  : "level enough that more results would settle it"}
                              </span>
                            </span>
                            <span className="shrink-0 text-[11px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                              Run one
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </Card>
            </div>

            <div className="min-w-0 space-y-4">
              {/* Recent verdicts — the record, in motion. */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Latest verdicts</CardTitle>
                    <p className="mt-0.5 text-xs text-ink-3">What you judged, most recent first</p>
                  </div>
                </CardHeader>
                <ul className="divide-y divide-line-subtle">
                  {data.recent.map((duel) => {
                    const winner = duel.winnerModelId ? data.models.get(duel.winnerModelId) : null;
                    return (
                      <li key={duel.id}>
                        <Link
                          href={`/duels/${duel.id}`}
                          className="flex items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-surface-2/60"
                        >
                          {duel.tie ? (
                            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[5px] border border-line bg-surface-2 text-ink-4">
                              <EqualApproximately className="size-3" />
                            </span>
                          ) : (
                            <ProviderMark
                              provider={winner?.provider ?? "other"}
                              size="xs"
                              className="mt-0.5"
                            />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] text-ink-2">
                              {duel.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-ink-4">
                              {duel.tie ? "Indistinguishable" : (winner?.name ?? "—")} ·{" "}
                              {relativeTime(duel.decidedAt ?? duel.createdAt, now)}
                            </span>
                          </span>
                          {!duel.tie && <Trophy className="mt-0.5 size-3 shrink-0 text-accent" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              {/* Money, compact — the payoff lives on Spend. */}
              <Link
                href="/spend"
                className="group block rounded-xl border border-line bg-surface-1 p-4 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-md"
              >
                <p className="flex items-center justify-between text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">
                  Spend this month
                  <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
                <p className="mt-1.5 font-mono text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-ink">
                  {formatCurrency(data.budget.spent, { maximumFractionDigits: 0 })}
                  <span className="text-[12px] font-normal text-ink-4">
                    {" "}
                    / {formatCurrency(data.budget.budget, { maximumFractionDigits: 0 })}
                  </span>
                </p>
                <Progress
                  className="mt-2"
                  value={data.budget.spent}
                  max={data.budget.budget}
                  tone={data.budget.state === "over" ? "negative" : "accent"}
                  label="Month-to-date spend against budget"
                />
                <p className="mt-2 text-[11.5px] text-ink-3">
                  Forecast {formatCurrency(data.budget.forecast, { maximumFractionDigits: 0 })} ·{" "}
                  {data.budget.daysLeft} days left
                </p>
              </Link>

              <Card className="overflow-hidden">
                <CardHeader>
                  <div>
                    <CardTitle>Activity</CardTitle>
                    <p className="mt-0.5 text-xs text-ink-3">Everything that happened, in order</p>
                  </div>
                </CardHeader>
                <div className="max-h-[26rem] overflow-y-auto">
                  <ActivityFeed events={workspace!.activity} limit={14} />
                </div>
              </Card>

              <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-ink-4">
                <Sparkles className="mt-0.5 size-3 shrink-0" />
                {example
                  ? "Everything here is computed from the sample duels. Run one of your own and this page becomes your record."
                  : "Everything here is computed from duels you judged. No vendor benchmark, no shared leaderboard — your work, your record."}
              </p>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
