"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Duel, Model } from "@/lib/data/types";
import { explainVerdict, type Verdict } from "@/lib/analytics/verdicts";
import { TASK_DESCRIPTION, TASK_LABEL } from "@/lib/data/seed/duels";
import { FormStrip, RecordBar, RecordScore, TallyMarks } from "@/components/ui/record";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { ConfidenceChip, ModelSwap, ReversalNote } from "./verdict-parts";

/**
 * One line of the routing table, expandable to the duels behind it.
 *
 * The expansion matters more than it looks: a recommendation you cannot audit
 * is just another opinion, and the whole pitch is that this one is *yours*.
 */
export function VerdictRow({
  verdict,
  models,
  duels,
  defaultOpen,
}: {
  verdict: Verdict;
  models: Map<string, Model>;
  duels: Duel[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const leader = verdict.standings[0];
  const current = verdict.currentModelId ? models.get(verdict.currentModelId) : undefined;
  const recommended = verdict.recommendedModelId
    ? models.get(verdict.recommendedModelId)
    : undefined;
  const evidence = duels
    .filter((d) => d.taskType === verdict.taskType && d.status === "decided")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const saves = verdict.monthlyDelta > 0;
  const costs = verdict.monthlyDelta < 0;

  return (
    <div className="border-b border-line-subtle last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors",
          "hover:bg-surface-2/60 lg:grid-cols-[minmax(0,15rem)_minmax(0,11rem)_minmax(0,1fr)_auto_auto]",
        )}
      >
        {/* Task */}
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium text-ink">
              {TASK_LABEL[verdict.taskType]}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-ink-4 transition-transform duration-200 lg:hidden",
                open && "rotate-180",
              )}
            />
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-ink-4">
            {verdict.runsPerMonth > 0
              ? `${formatNumber(verdict.runsPerMonth)} runs a month`
              : TASK_DESCRIPTION[verdict.taskType]}
          </span>
        </span>

        {/* Evidence */}
        <span className="hidden min-w-0 lg:block">
          {leader ? (
            <>
              <span className="flex items-center gap-2">
                <TallyMarks count={leader.wins} label={`${leader.wins} wins`} />
                <RecordScore wins={leader.wins} losses={leader.losses} ties={verdict.ties} size="sm" />
              </span>
              <RecordBar
                className="mt-1.5 w-24"
                height="sm"
                wins={leader.wins}
                losses={leader.losses}
                ties={verdict.ties}
              />
            </>
          ) : (
            <span className="text-[11.5px] text-ink-4">No duels yet</span>
          )}
        </span>

        {/* Routing */}
        <span className="hidden min-w-0 lg:block">
          <ModelSwap from={current} to={recommended} />
          {verdict.basis === "cheapest-of-equals" && (
            <span className="mt-0.5 block text-[10.5px] text-ink-4">
              No difference found — cheapest of equals
            </span>
          )}
        </span>

        <ConfidenceChip
          confidence={verdict.confidence}
          sampleSize={verdict.sampleSize}
          className="hidden lg:inline-flex"
        />

        {/* Money */}
        <span className="shrink-0 text-right">
          <span
            className={cn(
              "block font-mono text-[14px] font-semibold tabular-nums",
              saves && "text-positive",
              costs && "text-warning",
              !saves && !costs && "text-ink-4",
            )}
          >
            {saves ? "+" : costs ? "−" : ""}
            {verdict.monthlyDelta === 0
              ? "—"
              : formatCurrency(Math.abs(verdict.monthlyDelta), { maximumFractionDigits: 0 })}
          </span>
          <span className="block text-[10px] text-ink-4">
            {saves ? "saved / mo" : costs ? "extra / mo" : "no change"}
          </span>
        </span>
      </button>

      {/* Mobile summary, since the row's middle columns are desktop-only. */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 lg:hidden">
        <ConfidenceChip confidence={verdict.confidence} sampleSize={verdict.sampleSize} />
        {leader && <RecordScore wins={leader.wins} losses={leader.losses} ties={verdict.ties} size="sm" />}
        <ModelSwap from={current} to={recommended} className="basis-full" />
      </div>

      {open && (
        <div className="animate-rise border-t border-line-subtle bg-surface-2/30 px-4 py-3.5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-4">
                Standings
              </p>
              <ul className="mt-2 space-y-2">
                {verdict.standings.map((standing) => {
                  const model = models.get(standing.modelId);
                  const isRecommended = standing.modelId === verdict.recommendedModelId;
                  return (
                    <li key={standing.modelId} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "truncate text-[12.5px]",
                              isRecommended ? "font-medium text-ink" : "text-ink-2",
                            )}
                          >
                            {model?.name ?? standing.modelId}
                          </span>
                          {isRecommended && (
                            <span className="shrink-0 rounded-[3px] bg-accent-soft px-1 text-[9.5px] font-medium text-accent">
                              use this
                            </span>
                          )}
                        </span>
                        <RecordBar
                          className="mt-1 max-w-40"
                          height="sm"
                          wins={standing.wins}
                          losses={standing.losses}
                          ties={standing.ties}
                        />
                      </span>
                      <FormStrip form={standing.form} />
                      <RecordScore wins={standing.wins} losses={standing.losses} size="sm" />
                      <span className="w-16 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-4">
                        {formatCurrency(standing.avgCost, { maximumFractionDigits: 4 })}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Why this row says what it says. The recommendation above is
                  only worth following because this sentence sits under it. */}
              <p className="mt-3 border-t border-line-subtle pt-2.5 text-[11.5px] leading-relaxed text-ink-2">
                {explainVerdict(verdict, models)}
                {verdict.ties > 0 &&
                  verdict.confidence !== "too-close" &&
                  ` ${verdict.ties} ${verdict.ties === 1 ? "was" : "were"} judged indistinguishable.`}
              </p>

              {verdict.runsPerMonth > 0 && recommended && current && (
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line-subtle pt-2.5">
                  <div>
                    <dt className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-4">
                      Today
                    </dt>
                    <dd className="mt-0.5 font-mono text-[12.5px] font-medium tabular-nums text-ink">
                      {formatCurrency(verdict.currentMonthlyCost, { maximumFractionDigits: 0 })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-4">
                      Routed
                    </dt>
                    <dd className="mt-0.5 font-mono text-[12.5px] font-medium tabular-nums text-ink">
                      {formatCurrency(verdict.recommendedMonthlyCost, { maximumFractionDigits: 0 })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-4">
                      Per year
                    </dt>
                    <dd
                      className={cn(
                        "mt-0.5 font-mono text-[12.5px] font-medium tabular-nums",
                        verdict.monthlyDelta > 0 ? "text-positive" : "text-ink",
                      )}
                    >
                      {verdict.monthlyDelta > 0 ? "+" : ""}
                      {formatCurrency(verdict.monthlyDelta * 12, { maximumFractionDigits: 0 })}
                    </dd>
                  </div>
                </dl>
              )}
              <ReversalNote verdict={verdict} models={models} className="mt-2" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-4">
                The evidence · {evidence.length} judged
              </p>
              <ul className="mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-1">
                {evidence.map((duel) => {
                  const winner = duel.winnerModelId ? models.get(duel.winnerModelId) : null;
                  return (
                    <li key={duel.id}>
                      <Link
                        href={`/duels/${duel.id}`}
                        className="block rounded-md px-2 py-1.5 transition-colors hover:bg-surface-2"
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[12px] text-ink-2">{duel.title}</span>
                          <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-4">
                            {relativeTime(duel.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-ink-4">
                          <span className={duel.tie ? "text-ink-4" : "text-accent"}>
                            {duel.tie ? "Tie" : (winner?.name ?? "—")}
                          </span>
                          {duel.reason ? ` · ${duel.reason}` : ""}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
