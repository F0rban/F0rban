"use client";

import { ArrowRight, Repeat2 } from "lucide-react";
import type { Model } from "@/lib/data/types";
import type { Confidence, Verdict } from "@/lib/analytics/verdicts";
import { MIN_SAMPLE, confidenceLabel } from "@/lib/analytics/verdicts";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  "clear-winner": "border-accent-line bg-accent-soft text-accent",
  "too-close": "border-info/25 bg-info-soft text-info",
  emerging: "border-warning/25 bg-warning-soft text-warning",
  insufficient: "border-line bg-surface-2 text-ink-4",
};

const CONFIDENCE_EXPLAINER: Record<Confidence, string> = {
  "clear-winner": "The record is lopsided enough that chance is an unlikely explanation.",
  "too-close":
    "Enough head-to-heads to have found a difference, and none showed up. When two models are level, price decides.",
  emerging: "One model is ahead, but not by enough to rule out luck. Keep running these.",
  insufficient: "Too few results to say anything. This is a guess, not a verdict.",
};

export function ConfidenceChip({
  confidence,
  sampleSize,
  className,
}: {
  confidence: Confidence;
  /** Lets zero results read as "no evidence" rather than as an early signal. */
  sampleSize?: number;
  className?: string;
}) {
  return (
    <Tooltip content={CONFIDENCE_EXPLAINER[confidence]}>
      <span
        className={cn(
          "inline-flex shrink-0 cursor-help items-center rounded-sm border px-1.5 py-0.5",
          "text-[10.5px] font-medium leading-4",
          CONFIDENCE_STYLE[confidence],
          className,
        )}
      >
        {confidenceLabel(confidence, sampleSize ?? MIN_SAMPLE)}
      </span>
    </Tooltip>
  );
}

export function ModelChip({
  model,
  className,
  muted,
}: {
  model: Model | undefined;
  className?: string;
  muted?: boolean;
}) {
  if (!model) return <span className="text-[12px] text-ink-4">—</span>;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <ProviderMark provider={model.provider} size="xs" />
      <span className={cn("truncate text-[12.5px]", muted ? "text-ink-3" : "font-medium text-ink")}>
        {model.name}
      </span>
    </span>
  );
}

/** current → recommended, the shape of every routing change. */
export function ModelSwap({
  from,
  to,
  className,
}: {
  from: Model | undefined;
  to: Model | undefined;
  className?: string;
}) {
  const unchanged = from && to && from.id === to.id;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <ModelChip model={from} muted={!unchanged} />
      {!unchanged && (
        <>
          <ArrowRight className="size-3 shrink-0 text-ink-4" />
          <ModelChip model={to} />
        </>
      )}
    </span>
  );
}

export function ReversalNote({
  verdict,
  models,
  className,
}: {
  verdict: Verdict;
  models: Map<string, Model>;
  className?: string;
}) {
  if (!verdict.reversal) return null;
  const now = models.get(verdict.reversal.leaderId);
  const before = models.get(verdict.reversal.previousLeaderId);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-warning/25 bg-warning-soft px-1.5 py-0.5 text-[10.5px] font-medium text-warning",
        className,
      )}
    >
      <Repeat2 className="size-3" />
      {before?.name} led · {now?.name} has won {verdict.reversal.recentWins} of the last{" "}
      {verdict.reversal.recentOf}
    </span>
  );
}
