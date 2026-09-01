"use client";

import { TriangleAlert } from "lucide-react";
import type { BudgetStatus } from "@/lib/analytics/spend";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const COPY: Record<BudgetStatus["state"], { label: string; tone: string }> = {
  healthy: { label: "On track", tone: "text-positive" },
  watch: { label: "Watch", tone: "text-warning" },
  over: { label: "Over budget", tone: "text-negative" },
};

/**
 * Budget state for the current month, including the daily rate that would
 * land exactly on the ceiling — the number that actually changes behaviour.
 */
export function BudgetCard({ status }: { status: BudgetStatus }) {
  const copy = COPY[status.state];
  const tone = status.state === "over" ? "negative" : status.state === "watch" ? "warning" : "accent";

  return (
    <section className="rounded-xl border border-line bg-surface-1 p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">
            Monthly budget
          </p>
          <p className="mt-1.5 flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-mono text-[26px] font-semibold tabular-nums tracking-[-0.02em]",
                status.state === "over" ? "text-negative" : "text-ink",
              )}
            >
              {formatCurrency(status.spent, { maximumFractionDigits: 0 })}
            </span>
            <span className="font-mono text-[12px] tabular-nums text-ink-4">
              / {formatCurrency(status.budget, { maximumFractionDigits: 0 })}
            </span>
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
            status.state === "over"
              ? "border-negative/25 bg-negative-soft text-negative"
              : status.state === "watch"
                ? "border-warning/25 bg-warning-soft text-warning"
                : "border-positive/25 bg-positive-soft text-positive",
          )}
        >
          {status.state !== "healthy" && <TriangleAlert className="size-3" />}
          {copy.label}
        </span>
      </div>

      <Progress
        className="mt-3"
        value={status.spent}
        max={status.budget}
        tone={tone}
        marker={status.forecast}
        markerLabel={`Forecast ${formatCurrency(status.forecast)}`}
      />

      <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-line-subtle pt-3">
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink-4">
            Forecast
          </dt>
          <dd
            className={cn(
              "mt-0.5 font-mono text-[13px] font-semibold tabular-nums",
              status.forecast > status.budget ? "text-negative" : "text-ink",
            )}
          >
            {formatCurrency(status.forecast, { maximumFractionDigits: 0 })}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink-4">
            Remaining
          </dt>
          <dd
            className={cn(
              "mt-0.5 font-mono text-[13px] font-semibold tabular-nums",
              status.remaining < 0 ? "text-negative" : "text-ink",
            )}
          >
            {formatCurrency(status.remaining, { maximumFractionDigits: 0 })}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink-4">
            Safe / day
          </dt>
          <dd className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums text-ink">
            {formatCurrency(status.safeDailyRate)}
          </dd>
        </div>
      </dl>

      <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-4">
        {status.daysLeft === 0
          ? "Last day of the month."
          : status.state === "over"
            ? `At the current rate you land ${formatCurrency(status.forecast - status.budget)} over with ${status.daysLeft} days left. Staying under means ${formatCurrency(status.safeDailyRate)}/day from here.`
            : `${status.daysLeft} days left. ${formatCurrency(status.safeDailyRate)}/day keeps you under the ceiling.`}
      </p>
    </section>
  );
}
