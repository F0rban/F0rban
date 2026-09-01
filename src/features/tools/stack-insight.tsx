"use client";

import { ArrowRight, PiggyBank } from "lucide-react";
import type { Tool } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils/format";
import { costPerUse } from "./tool-meta";

/**
 * The one number a subscription review is actually about.
 *
 * Only rendered when there is something to say — an insight strip that appears
 * unconditionally is decoration, and the whole point of this page is that the
 * numbers should change a decision.
 */
export function StackInsight({
  tools,
  onReview,
}: {
  tools: Tool[];
  onReview: () => void;
}) {
  const candidates = tools
    .filter((tool) => tool.status === "active" && tool.monthlyCost > 0 && tool.usage30d < 12)
    .sort((a, b) => b.monthlyCost - a.monthlyCost);

  const trials = tools.filter((tool) => tool.status === "trial" && tool.monthlyCost > 0);
  const atRisk = candidates.reduce((sum, tool) => sum + tool.monthlyCost, 0);
  const trialCost = trials.reduce((sum, tool) => sum + tool.monthlyCost, 0);

  if (candidates.length === 0 && trials.length === 0) return null;

  const worst = candidates[0];
  const worstPerUse = worst ? costPerUse(worst.monthlyCost, worst.usage30d) : null;

  return (
    <section className="mt-3 flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-3.5 shadow-xs sm:flex-row sm:items-center">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-warning/25 bg-warning-soft text-warning">
        <PiggyBank className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-ink">
          {candidates.length > 0 ? (
            <>
              <span className="font-mono tabular-nums">{formatCurrency(atRisk)}</span>/month sits in{" "}
              {candidates.length === 1
                ? "a subscription you barely open"
                : `${candidates.length} subscriptions you barely open`}
            </>
          ) : (
            <>
              <span className="font-mono tabular-nums">{formatCurrency(trialCost)}</span>/month of
              trials {trials.length === 1 ? "needs" : "need"} a decision
            </>
          )}
        </p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">
          {worst && worstPerUse !== null ? (
            <>
              {worst.name} costs{" "}
              <span className="font-mono tabular-nums text-ink-2">
                {formatCurrency(worstPerUse, { maximumFractionDigits: 2 })}
              </span>{" "}
              per use.{" "}
            </>
          ) : null}
          {trials.length > 0 && candidates.length > 0 && (
            <>
              {trials.length === 1
                ? "One trial also converts soon, adding "
                : `${trials.length} trials also convert soon, adding `}
              <span className="font-mono tabular-nums text-ink-2">
                {formatCurrency(trialCost)}
              </span>
              /month.
            </>
          )}
          {candidates.length > 0 && trials.length === 0 && (
            <>
              Dropping {candidates.length === 1 ? "it" : "them"} would save{" "}
              <span className="font-mono tabular-nums text-ink-2">
                {formatCurrency(atRisk * 12)}
              </span>{" "}
              a year.
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onReview}
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-ink sm:self-auto"
      >
        Review them
        <ArrowRight className="size-3" />
      </button>
    </section>
  );
}
