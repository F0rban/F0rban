"use client";

import Link from "next/link";
import { ArrowRight, EqualApproximately, Gavel, Swords, Trophy } from "lucide-react";
import type { Duel, Model } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { RecordScore } from "@/components/ui/record";
import { ModelSwap } from "@/features/verdicts/verdict-parts";
import { CONFIDENCE_LABEL, MIN_SAMPLE, isActionable } from "@/lib/analytics/verdicts";
import { TASK_LABEL } from "@/lib/data/seed/duels";
import { formatCurrency, formatDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Reveal } from "./reveal";

/** "3.4×", or "12×" once the decimal stops meaning anything. */
function times(ratio: number): string {
  return `${ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)}×`;
}

const money = (value: number) => formatCurrency(value, { maximumFractionDigits: 4 });

/**
 * What the verdict cost, in one sentence. The point is the comparison the user
 * could not make while judging: they picked on quality alone, and only now see
 * what the two answers were priced at.
 */
function PriceLine({ reveal }: { reveal: Reveal }) {
  const { winner, rival, costRatio, latencyRatio, cheapest, dearest } = reveal;

  if (!winner) {
    if (cheapest && dearest && cheapest !== dearest && dearest.entry.cost / cheapest.entry.cost >= 1.2) {
      return (
        <>
          Level on quality.{" "}
          <span className="font-medium text-ink">{cheapest.model.name}</span> costs{" "}
          <span className="font-semibold text-positive">
            {times(dearest.entry.cost / cheapest.entry.cost)} less
          </span>{" "}
          than {dearest.model.name} — and when two are level, price decides.
        </>
      );
    }
    return <>Level on quality, and on price.</>;
  }

  if (!rival || costRatio === null) return <>Only one model took part, so there is nothing to price it against.</>;

  const costs = (
    <span className="font-mono text-ink-2">
      {money(winner.entry.cost)} against {money(rival.entry.cost)}
    </span>
  );

  let cost: React.ReactNode;
  if (costRatio <= 1 / 1.2) {
    cost = (
      <>
        It cost <span className="font-semibold text-positive">{times(1 / costRatio)} less</span> than{" "}
        {rival.model.name} — {costs}
      </>
    );
  } else if (costRatio >= 1.2) {
    cost = (
      <>
        It cost <span className="font-semibold text-warning">{times(costRatio)} more</span> than{" "}
        {rival.model.name} — {costs}
      </>
    );
  } else {
    cost = (
      <>
        It cost about the same as {rival.model.name} — {costs}
      </>
    );
  }

  let speed: React.ReactNode = ".";
  if (latencyRatio !== null && latencyRatio <= 1 / 1.3) {
    speed = (
      <>
        , and answered {times(1 / latencyRatio)} faster ({formatDuration(winner.entry.latencyMs)} against{" "}
        {formatDuration(rival.entry.latencyMs)}).
      </>
    );
  } else if (latencyRatio !== null && latencyRatio >= 1.3) {
    speed = <>, and took {times(latencyRatio)} longer to answer.</>;
  }

  return (
    <>
      {cost}
      {speed}
    </>
  );
}

function RoutingLine({ reveal, models }: { reveal: Reveal; models: Map<string, Model> }) {
  const { after, leader } = reveal;
  const current = after.currentModelId ? models.get(after.currentModelId) : undefined;
  const recommended = after.recommendedModelId ? models.get(after.recommendedModelId) : undefined;

  if (!current) {
    return <span className="text-ink-3">Set how often you run this in Settings to price it.</span>;
  }
  if (isActionable(after) && recommended) {
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <ModelSwap from={current} to={recommended} />
        <span
          className={cn(
            "font-mono text-[12px] font-semibold tabular-nums",
            after.monthlyDelta > 0 ? "text-positive" : "text-warning",
          )}
        >
          {after.monthlyDelta > 0 ? "+" : "−"}
          {formatCurrency(Math.abs(after.monthlyDelta), { maximumFractionDigits: 0 })}
          <span className="font-sans font-normal text-ink-4"> / mo</span>
        </span>
      </span>
    );
  }
  if (after.confidence === "insufficient") {
    const more = Math.max(1, MIN_SAMPLE - after.sampleSize);
    return (
      <span className="text-ink-3">
        {more} more {more === 1 ? "duel" : "duels"} to get past a guess.
      </span>
    );
  }
  if (recommended && recommended.id === current.id) {
    return <span className="text-ink-3">Agrees with what is routed today. Nothing to change.</span>;
  }
  return (
    <span className="text-ink-3">
      Leaning {leader?.name ?? "one way"} — not settled yet, keep running these.
    </span>
  );
}

/**
 * The reveal.
 *
 * Shown the moment a verdict exists, and every time the duel is opened after
 * that. Three things, in order: what was picked and what it cost, what that did
 * to the record for this kind of work, and what to do next — because the only
 * reason to build this screen well is so the user runs another one.
 */
export function RevealPanel({
  duel,
  reveal,
  models,
}: {
  duel: Duel;
  reveal: Reveal;
  models: Map<string, Model>;
}) {
  const { winner, before, after, leader, leaderBefore, leaderAfter, nextPending } = reveal;
  const confidenceMoved = before.confidence !== after.confidence;
  const label = TASK_LABEL[duel.taskType];

  return (
    <section
      aria-label="The reveal"
      className="mt-5 overflow-hidden rounded-xl border border-accent-line/60 bg-surface-1 shadow-xs"
    >
      <div className="p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-accent">
          {winner ? <Trophy className="size-3" /> : <EqualApproximately className="size-3" />}
          The reveal
          {duel.sample && <span className="text-ink-4"> · sample duel</span>}
        </p>
        {winner ? (
          <h2 className="mt-2 text-balance text-[20px] font-semibold leading-snug tracking-[-0.02em] text-ink sm:text-[22px]">
            You picked <span className="text-accent">{winner.model.name}</span>, blind.
          </h2>
        ) : (
          <h2 className="mt-2 text-[20px] font-semibold leading-snug tracking-[-0.02em] text-ink sm:text-[22px]">
            Judged indistinguishable
          </h2>
        )}
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-3">
          <PriceLine reveal={reveal} />
        </p>
        {duel.reason && (
          <p className="mt-2.5 border-l-2 border-line-strong pl-3 text-[12.5px] italic leading-relaxed text-ink-2">
            “{duel.reason}”
          </p>
        )}
      </div>

      {/* What the click did. */}
      <dl className="grid gap-px border-t border-line-subtle bg-line-subtle sm:grid-cols-3">
        <div className="bg-surface-1 px-4 py-3">
          <dt className="text-[10px] font-medium uppercase tracking-[0.07em] text-ink-4">
            {label} record
          </dt>
          <dd className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink">
            {leader && leaderAfter ? (
              <>
                <span className="font-medium">{leader.name}</span>
                {leaderBefore ? (
                  <>
                    <RecordScore wins={leaderBefore.wins} losses={leaderBefore.losses} ties={leaderBefore.ties} size="sm" className="text-ink-4" />
                    <ArrowRight className="size-3 text-ink-4" />
                  </>
                ) : null}
                <RecordScore wins={leaderAfter.wins} losses={leaderAfter.losses} ties={leaderAfter.ties} />
                {!leaderBefore && <span className="text-[11px] text-ink-4">first result</span>}
              </>
            ) : (
              <span className="text-ink-3">No decisive result yet.</span>
            )}
          </dd>
        </div>
        <div className="bg-surface-1 px-4 py-3">
          <dt className="text-[10px] font-medium uppercase tracking-[0.07em] text-ink-4">Confidence</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink">
            {confidenceMoved && (
              <>
                <span className="text-ink-4">{CONFIDENCE_LABEL[before.confidence]}</span>
                <ArrowRight className="size-3 text-ink-4" />
              </>
            )}
            <span className={cn("font-medium", confidenceMoved && "text-accent")}>
              {CONFIDENCE_LABEL[after.confidence]}
            </span>
            <span className="text-[11px] text-ink-4">· {after.sampleSize} judged</span>
          </dd>
        </div>
        <div className="bg-surface-1 px-4 py-3">
          <dt className="text-[10px] font-medium uppercase tracking-[0.07em] text-ink-4">Routing</dt>
          <dd className="mt-1 text-[12.5px] text-ink">
            <RoutingLine reveal={reveal} models={models} />
          </dd>
        </div>
      </dl>

      {duel.sample && (
        <p className="border-t border-line-subtle bg-surface-2/40 px-4 py-2 text-[11.5px] text-ink-3">
          This is a sample duel: it moved the worked example&apos;s record, not yours. Your first
          own duel starts your record.
        </p>
      )}

      {/* Next. The whole screen exists so this gets clicked. */}
      <footer className="flex flex-wrap items-center gap-2 border-t border-line-subtle bg-surface-2/40 p-3">
        {nextPending ? (
          <>
            <Button variant="primary" size="sm" asChild>
              <Link href={`/duels/${nextPending.id}`}>
                <Gavel className="size-3.5" />
                Judge the next one
              </Link>
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/duels/new?task=${duel.taskType}`}>
                <Swords className="size-3.5" />
                Run another {label.toLowerCase()} duel
              </Link>
            </Button>
          </>
        ) : (
          <Button variant="primary" size="sm" asChild>
            <Link href={`/duels/new?task=${duel.taskType}`}>
              <Swords className="size-3.5" />
              Run another {label.toLowerCase()} duel
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild className="ml-auto">
          <Link href="/verdicts">
            See verdicts
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </footer>
    </section>
  );
}
