"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck, Gavel, Scale, Swords, TrendingUp } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SampleBanner } from "@/components/layout/sample-banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VerdictRow } from "@/features/verdicts/verdict-row";
import { useWorkspace } from "@/hooks/use-workspace";
import { allVerdicts, evidenceCoverage, routingSummary } from "@/lib/analytics/verdicts";
import { evidenceMode } from "@/lib/analytics/evidence";
import { TASK_TYPES } from "@/lib/data/seed/duels";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * The routing table.
 *
 * The whole product exists to produce this screen: for each kind of work, the
 * model your own head-to-heads say to use, and what your current habit costs
 * you. Everything else is either input to it or evidence behind it.
 */
export default function VerdictsPage() {
  const { workspace, ready } = useWorkspace();

  const data = useMemo(() => {
    if (!workspace) return null;
    const verdicts = allVerdicts(
      workspace.duels,
      workspace.models,
      workspace.taskProfiles,
      TASK_TYPES,
    );
    return {
      verdicts,
      summary: routingSummary(verdicts),
      coverage: evidenceCoverage(verdicts),
      models: new Map(workspace.models.map((m) => [m.id, m])),
    };
  }, [workspace]);

  if (!ready || !data) {
    return (
      <PageContainer>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
        <Skeleton className="mt-4 h-96 w-full rounded-xl" />
      </PageContainer>
    );
  }

  const { summary, coverage, models, verdicts } = data;
  const yearly = summary.actionableSaving * 12;
  const example = evidenceMode(workspace!) === "example";

  const sections = [
    {
      key: "actionable",
      title: "Change these",
      caption: example
        ? "The example's results say a different model, and it costs less."
        : "Your own results say a different model, and it costs less.",
      icon: TrendingUp,
      rows: summary.actionable,
      open: true,
    },
    {
      key: "judgement",
      title: "Your call",
      caption: "A different model is ahead, but it costs more. Only you can price that.",
      icon: Scale,
      rows: summary.qualityUpgrades,
      open: false,
    },
    {
      key: "confirmed",
      title: "Already right",
      caption: "The evidence agrees with what you are doing. Nothing to change.",
      icon: CircleCheck,
      rows: summary.confirmed,
      open: false,
    },
    {
      key: "pending",
      title: "Not settled",
      caption: "A lean, or not enough results yet. Run a few more of these.",
      icon: Gavel,
      rows: summary.needsEvidence.filter(
        (v) => !summary.confirmed.includes(v) && !summary.qualityUpgrades.includes(v),
      ),
      open: false,
    },
  ].filter((section) => section.rows.length > 0);

  return (
    <PageContainer>
      <PageHeader
        title="Verdicts"
        description={
          example
            ? "What the worked example's head-to-heads say to use for each kind of work — and what its habits cost. Your own duels will replace it."
            : "What your own head-to-heads say to use for each kind of work — and what your current habits cost."
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

      {/* The number the product exists to produce. */}
      <section className="mt-5 overflow-hidden rounded-xl border border-line bg-surface-1 shadow-xs">
        <div className="grid grid-cols-2 gap-px bg-line-subtle lg:grid-cols-4">
          <div className="bg-surface-1 p-4">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">
              Routing you can change today
            </p>
            <p className="mt-1.5 font-mono text-[24px] font-semibold leading-8 tabular-nums tracking-[-0.03em] text-positive sm:text-[30px] sm:leading-9">
              {formatCurrency(summary.actionableSaving, { maximumFractionDigits: 0 })}
              <span className="text-[13px] font-normal text-ink-4"> / mo</span>
            </p>
            <p className="mt-1 text-[11.5px] text-ink-3">
              {formatCurrency(yearly, { maximumFractionDigits: 0 })} a year, across{" "}
              {summary.actionable.length} task type{summary.actionable.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="bg-surface-1 p-4">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">
              Current routing costs
            </p>
            <p className="mt-1.5 font-mono text-[24px] font-semibold leading-8 tabular-nums tracking-[-0.03em] text-ink sm:text-[30px] sm:leading-9">
              {formatCurrency(summary.currentMonthlyCost, { maximumFractionDigits: 0 })}
              <span className="text-[13px] font-normal text-ink-4"> / mo</span>
            </p>
            <p className="mt-1 text-[11.5px] text-ink-3">
              {summary.currentMonthlyCost > 0
                ? `${Math.round((summary.actionableSaving / summary.currentMonthlyCost) * 100)}% of it is avoidable`
                : "Set your volumes in Settings"}
            </p>
          </div>

          <div className="bg-surface-1 p-4">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">
              Waiting on evidence
            </p>
            <p className="mt-1.5 font-mono text-[24px] font-semibold leading-8 tabular-nums tracking-[-0.03em] text-ink sm:text-[30px] sm:leading-9">
              {formatCurrency(summary.pendingSaving, { maximumFractionDigits: 0 })}
              <span className="text-[13px] font-normal text-ink-4"> / mo</span>
            </p>
            <p className="mt-1 text-[11.5px] text-ink-3">
              Behind {summary.needsEvidence.length} verdict
              {summary.needsEvidence.length === 1 ? "" : "s"} that have not settled
            </p>
          </div>

          <div className="bg-surface-1 p-4">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">
              Evidence
            </p>
            <p className="mt-1.5 font-mono text-[24px] font-semibold leading-8 tabular-nums tracking-[-0.03em] text-ink sm:text-[30px] sm:leading-9">
              {coverage.totalDuels}
            </p>
            <p className="mt-1 text-[11.5px] text-ink-3">
              duels judged · {coverage.covered} of {coverage.total} task types settled
            </p>
          </div>
        </div>
      </section>

      {verdicts.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<Gavel />}
          title="No verdicts yet"
          description="Verdicts are computed from duels. Run a few head-to-heads and the routing table builds itself."
          action={
            <Button variant="primary" size="sm" asChild>
              <Link href="/duels/new">Run your first duel</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-4 space-y-4">
          {sections.map((section) => (
            <section
              key={section.key}
              className="overflow-hidden rounded-xl border border-line bg-surface-1 shadow-xs"
            >
              <header className="flex items-start gap-2.5 border-b border-line-subtle px-4 py-3">
                <section.icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    section.key === "actionable" && "text-positive",
                    section.key === "judgement" && "text-warning",
                    section.key === "confirmed" && "text-ink-4",
                    section.key === "pending" && "text-ink-4",
                  )}
                />
                <div className="min-w-0">
                  <h2 className="text-[13px] font-semibold text-ink">
                    {section.title}
                    <span className="ml-2 font-mono text-[11px] font-normal tabular-nums text-ink-4">
                      {section.rows.length}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-3">{section.caption}</p>
                </div>
              </header>
              <div>
                {section.rows.map((verdict) => (
                  <VerdictRow
                    key={verdict.taskType}
                    verdict={verdict}
                    models={models}
                    duels={workspace!.duels}
                    defaultOpen={section.open && summary.actionable[0] === verdict}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-ink-4">
        Savings assume the volumes in
        <Link href="/settings" className="inline-flex items-center gap-1 text-accent hover:underline">
          Settings
          <ArrowRight className="size-3" />
        </Link>
      </p>
    </PageContainer>
  );
}
