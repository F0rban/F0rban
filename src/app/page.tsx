"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Gavel, Repeat2, Sparkles, Swords, TrendingUp } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SampleBanner } from "@/components/layout/sample-banner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordScore, TallyMarks } from "@/components/ui/record";
import { ModelSwap } from "@/features/verdicts/verdict-parts";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  MIN_SAMPLE,
  allVerdicts,
  evidenceCoverage,
  routingSummary,
  type RoutingSummary,
  type Verdict,
} from "@/lib/analytics/verdicts";
import { evidenceMode } from "@/lib/analytics/evidence";
import { TASK_LABEL, TASK_TYPES } from "@/lib/data/seed/duels";
import type { Duel, Model } from "@/lib/data/types";
import { formatCurrency, pluralize } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

/** Open duels shown before the list folds into a count. */
const QUEUE_LIMIT = 3;
/** Routing changes shown before the rest is left to Verdicts. */
const CHANGES_LIMIT = 3;

function greeting(hour: number): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Today.
 *
 * Three questions, in order, and nothing else: what can I do now (the open
 * duels), what has the evidence learned (the routing changes it supports), and
 * does it change how I work (how much of the record is settled, and where the
 * next result would settle it). Spend, activity and the full verdict table
 * live on their own pages; a home screen that shows everything answers nothing.
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
    return {
      summary: routingSummary(verdicts),
      models: new Map(workspace.models.map((m) => [m.id, m])),
      coverage: evidenceCoverage(verdicts),
      pending: workspace.duels
        .filter((d) => d.status === "pending")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      reversals: verdicts.filter((v) => v.reversal),
      // Closest to a verdict first: these are the duels most worth running.
      unsettled: verdicts
        .filter((v) => v.confidence === "insufficient" || v.confidence === "emerging")
        .sort((a, b) => b.sampleSize - a.sampleSize),
    };
  }, [workspace]);

  const name = workspace?.preferences.displayName?.trim();
  // Every "your" on this page has to be earned. Until the user's first own
  // duel, the record on screen belongs to the worked example, and says so.
  const example = workspace ? evidenceMode(workspace) === "example" : false;

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title={name ? `${greeting(now.getHours())}, ${name}` : greeting(now.getHours())}
        description={
          data
            ? data.coverage.totalDuels === 0
              ? "No duels judged yet."
              : `${pluralize(data.coverage.totalDuels, "duel")} judged · ${data.coverage.covered} of ${data.coverage.total} kinds of work settled`
            : "Loading the record…"
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
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <Headline
            example={example}
            summary={data.summary}
            coverage={data.coverage}
            pending={data.pending}
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
            <Queue pending={data.pending} now={now} />
            <Learned
              example={example}
              summary={data.summary}
              reversals={data.reversals}
              unsettled={data.unsettled}
              models={data.models}
            />
          </div>

          {/* Does it change how I work? One line, and where the next result lands. */}
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-line-subtle bg-surface-2/40 px-4 py-3 text-[12px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/verdicts" className="group inline-flex items-center gap-1.5 hover:text-ink">
              <span className="font-mono font-semibold tabular-nums text-ink">
                {data.coverage.covered}
              </span>{" "}
              of {data.coverage.total} kinds of work settled
              <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            {data.unsettled.length > 0 && (
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-ink-4">Closest to a verdict:</span>
                {data.unsettled.slice(0, 3).map((verdict) => (
                  <Link
                    key={verdict.taskType}
                    href={`/duels/new?task=${verdict.taskType}`}
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    {TASK_LABEL[verdict.taskType]}
                    <span className="font-mono text-[10.5px] tabular-nums text-ink-4">
                      {verdict.sampleSize}
                    </span>
                  </Link>
                ))}
              </span>
            )}
          </div>

          <p className="mt-3 flex items-start gap-2 px-1 text-[11px] leading-relaxed text-ink-4">
            <Sparkles className="mt-0.5 size-3 shrink-0" />
            {example
              ? "Everything here is computed from the sample duels. Run one of your own and this page becomes your record."
              : "Everything here is computed from duels you judged. No vendor benchmark, no shared leaderboard — your work, your record."}
          </p>
        </>
      )}
    </PageContainer>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The one number, or an honest reason there is not one yet. Never "$0": a
 * record with nothing to change is a different sentence from a record that has
 * not started.
 */
function Headline({
  example,
  summary,
  coverage,
  pending,
}: {
  example: boolean;
  summary: RoutingSummary;
  coverage: ReturnType<typeof evidenceCoverage>;
  pending: Duel[];
}) {
  const saving = summary.actionableSaving;

  let icon = TrendingUp;
  let href = "/verdicts";
  let title: React.ReactNode;
  let detail: string;
  let cta = "See the routing table";

  if (saving > 0) {
    title = (
      <>
        {example
          ? "In this worked example, the record says the habit overpays by"
          : "Your own results say you are overpaying by"}{" "}
        <span className="text-positive">{formatCurrency(saving, { maximumFractionDigits: 0 })}</span>{" "}
        a month.
      </>
    );
    detail = `Across ${pluralize(summary.actionable.length, "kind")} of work where a cheaper model already won ${example ? "the sample" : "your"} head-to-heads — ${formatCurrency(saving * 12, { maximumFractionDigits: 0 })} a year, out of ${formatCurrency(summary.currentMonthlyCost, { maximumFractionDigits: 0 })} routed today.`;
  } else if (coverage.totalDuels === 0) {
    icon = Gavel;
    href = pending[0] ? `/duels/${pending[0].id}` : "/duels/new";
    title = "No verdicts yet.";
    detail = `Judge a duel and the record starts. A verdict settles after ${MIN_SAMPLE} results for a kind of work.`;
    cta = pending[0] ? "Judge the first one" : "Run the first duel";
  } else if (coverage.covered === 0) {
    icon = Gavel;
    title = `${pluralize(coverage.totalDuels, "duel")} judged, nothing settled yet.`;
    detail = `Verdicts settle at ${MIN_SAMPLE} results per kind of work. Keep judging — the routing table builds itself.`;
  } else {
    title = example ? "The example record agrees with its habits." : "Your record agrees with your habits.";
    detail = `${coverage.covered} of ${coverage.total} kinds of work settled, and none of them say to switch models.`;
  }

  const Icon = icon;

  return (
    <Link
      href={href}
      className={cn(
        "group mt-5 flex flex-col gap-4 rounded-xl border border-line bg-surface-1 p-5 shadow-xs",
        "transition-[border-color,box-shadow] duration-200 hover:border-accent-line hover:shadow-md",
        "sm:flex-row sm:items-center",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-accent-line/60 bg-accent-soft text-accent">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-balance text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink sm:text-[21px]">
          {title}
        </span>
        <span className="mt-1.5 block text-[12.5px] leading-relaxed text-ink-3">{detail}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-accent">
        {cta}
        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** What can I do now. The only thing the product asks of you. */
function Queue({ pending, now }: { pending: Duel[]; now: Date }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Waiting for a verdict</CardTitle>
          <p className="mt-0.5 text-xs text-ink-3">
            {pending.length === 0
              ? "Nothing to judge right now."
              : "Names and prices stay hidden until you pick."}
          </p>
        </div>
        {pending.length > 0 && (
          <Badge tone="accent" dot>
            {pending.length}
          </Badge>
        )}
      </CardHeader>

      {pending.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-ink-4">
            <Gavel className="size-4" />
          </span>
          <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink-3">
            The next time you are about to pick a model, run it as a duel instead.
          </p>
          <Button variant="secondary" size="sm" asChild className="shrink-0">
            <Link href="/duels/new">Run one</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line-subtle">
            {pending.slice(0, QUEUE_LIMIT).map((duel) => (
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
          {pending.length > QUEUE_LIMIT && (
            <Link
              href="/duels?status=pending"
              className="block border-t border-line-subtle px-4 py-2.5 text-[11.5px] text-ink-3 transition-colors hover:text-ink"
            >
              {pending.length - QUEUE_LIMIT} more waiting
            </Link>
          )}
        </>
      )}
    </Card>
  );
}

/** What has the evidence learned. Routing changes first; reversals beside them. */
function Learned({
  example,
  summary,
  reversals,
  unsettled,
  models,
}: {
  example: boolean;
  summary: RoutingSummary;
  reversals: Verdict[];
  unsettled: Verdict[];
  models: Map<string, Model>;
}) {
  const changes = summary.actionable.slice(0, CHANGES_LIMIT);
  const hasNews = changes.length > 0 || reversals.length > 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>
            {hasNews
              ? example
                ? "What the example's evidence says"
                : "What your evidence says"
              : "Where the next result lands"}
          </CardTitle>
          <p className="mt-0.5 text-xs text-ink-3">
            {hasNews
              ? "The routing changes with the biggest gap between habit and record"
              : "Nothing to change yet — these kinds of work are closest to a verdict"}
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
        {changes.map((verdict) => {
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
                    <RecordScore wins={leader.wins} losses={leader.losses} ties={verdict.ties} size="sm" />
                  </span>
                  {/* Block-level and capped, so long model names truncate instead
                      of running under the money column on a phone. */}
                  <ModelSwap
                    className="mt-1 flex max-w-full"
                    from={verdict.currentModelId ? models.get(verdict.currentModelId) : undefined}
                    to={verdict.recommendedModelId ? models.get(verdict.recommendedModelId) : undefined}
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

        {reversals.map((verdict) => (
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
                  {models.get(verdict.reversal!.previousLeaderId)?.name} led on the lifetime record,
                  but {models.get(verdict.reversal!.leaderId)?.name} has won{" "}
                  {verdict.reversal!.recentWins} of the last {verdict.reversal!.recentOf}.
                </span>
              </span>
            </Link>
          </li>
        ))}

        {!hasNews &&
          unsettled.slice(0, 4).map((verdict) => (
            <li key={verdict.taskType}>
              <Link
                href={`/duels/new?task=${verdict.taskType}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[12.5px] font-medium text-ink">
                      {TASK_LABEL[verdict.taskType]}
                    </span>
                    <TallyMarks
                      count={verdict.sampleSize}
                      tone="tie"
                      label={`${verdict.sampleSize} results so far`}
                    />
                  </span>
                  <span className="mt-0.5 block text-[11px] text-ink-4">
                    {verdict.sampleSize < MIN_SAMPLE
                      ? `${MIN_SAMPLE - verdict.sampleSize} more to get past a guess`
                      : "level enough that more results would settle it"}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] font-medium text-accent">Run one</span>
              </Link>
            </li>
          ))}

        {!hasNews && unsettled.length === 0 && (
          <li className="px-4 py-5 text-[12.5px] leading-snug text-ink-3">
            Every kind of work you have judged is settled. Run a duel the next time a model choice
            matters, and the record keeps checking itself.
          </li>
        )}
      </ul>
    </Card>
  );
}
