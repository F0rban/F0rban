"use client";

import { Scale, X } from "lucide-react";
import type { Model } from "@/lib/data/types";
import { Radar } from "@/components/charts/radar";
import { EmptyState } from "@/components/ui/empty-state";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCompact, formatDuration } from "@/lib/utils/format";
import { blendedRate } from "@/lib/analytics/spend";
import { cn } from "@/lib/utils/cn";
import { CostCalculator } from "./cost-calculator";
import { METRIC_KEYS, METRIC_LABEL, compareColor } from "./model-meta";

interface SpecRow {
  label: string;
  hint?: string;
  value: (model: Model) => string;
  /** Which direction is better, for the "best" highlight. */
  best?: "high" | "low";
  score: (model: Model) => number;
}

const SPECS: SpecRow[] = [
  {
    label: "Input",
    hint: "USD per 1M input tokens",
    value: (m) => `$${m.inputPrice}`,
    best: "low",
    score: (m) => m.inputPrice,
  },
  {
    label: "Output",
    hint: "USD per 1M output tokens",
    value: (m) => `$${m.outputPrice}`,
    best: "low",
    score: (m) => m.outputPrice,
  },
  {
    label: "Blended",
    hint: "USD per 1M tokens at a 25% output ratio",
    value: (m) => `$${blendedRate(m).toFixed(2)}`,
    best: "low",
    score: (m) => blendedRate(m),
  },
  {
    label: "Context",
    value: (m) => formatCompact(m.contextWindow),
    best: "high",
    score: (m) => m.contextWindow,
  },
  {
    label: "Max output",
    value: (m) => formatCompact(m.maxOutput),
    best: "high",
    score: (m) => m.maxOutput,
  },
  {
    label: "Throughput",
    hint: "Output tokens per second",
    value: (m) => `${m.throughput}/s`,
    best: "high",
    score: (m) => m.throughput,
  },
  {
    label: "First token",
    hint: "Time to first token",
    value: (m) => formatDuration(m.latencyMs),
    best: "low",
    score: (m) => m.latencyMs,
  },
  {
    label: "Your score",
    value: (m) => (m.personalScore === null ? "—" : m.personalScore.toFixed(1)),
    best: "high",
    score: (m) => m.personalScore ?? -1,
  },
];

export function ComparisonPanel({
  models,
  onRemove,
  onClear,
}: {
  models: Model[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (models.length === 0) {
    return (
      <EmptyState
        icon={<Scale />}
        title="Pick models to compare"
        description="Select up to four from the list. You get an overlaid capability profile, a spec table with the winner in each row, and what your actual workload would cost on each."
        compact
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {models.map((model, index) => (
          <span
            key={model.id}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 py-1 pl-2 pr-1 text-[11.5px] text-ink-2"
          >
            <span
              className="size-1.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: compareColor(index) }}
            />
            <span className="max-w-32 truncate">{model.name}</span>
            <button
              type="button"
              onClick={() => onRemove(model.id)}
              aria-label={`Remove ${model.name} from comparison`}
              className="grid size-4 place-items-center rounded text-ink-4 transition-colors hover:bg-surface-3 hover:text-ink-2"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        {models.length > 1 && (
          <button
            type="button"
            onClick={onClear}
            className="ml-1 text-[11px] text-ink-4 transition-colors hover:text-ink-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Capability profile */}
      <section className="rounded-xl border border-line bg-surface-1 shadow-xs">
        <header className="border-b border-line-subtle px-3.5 py-2.5">
          <h3 className="text-[12.5px] font-semibold text-ink">Capability profile</h3>
          <p className="mt-0.5 text-[11px] text-ink-4">
            Normalised 0–100. Speed is throughput, not quality.
          </p>
        </header>
        <div className="grid place-items-center p-3">
          <Radar
            size={268}
            axes={METRIC_KEYS.map((key) => METRIC_LABEL[key])}
            series={models.map((model, index) => ({
              key: model.id,
              label: model.name,
              color: compareColor(index),
              values: METRIC_KEYS.map((key) => model.scores[key]),
            }))}
          />
        </div>
      </section>

      {/* Spec table */}
      <section className="overflow-hidden rounded-xl border border-line bg-surface-1 shadow-xs">
        <header className="border-b border-line-subtle px-3.5 py-2.5">
          <h3 className="text-[12.5px] font-semibold text-ink">Specifications</h3>
          <p className="mt-0.5 text-[11px] text-ink-4">Best value in each row is highlighted.</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Model specification comparison</caption>
            <thead>
              <tr className="border-b border-line-subtle">
                <th scope="col" className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.07em] text-ink-4">
                  Spec
                </th>
                {models.map((model, index) => (
                  <th key={model.id} scope="col" className="px-2 py-2 text-right">
                    <span className="flex items-center justify-end gap-1.5">
                      <span
                        className="size-1.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: compareColor(index) }}
                      />
                      <span className="max-w-24 truncate text-[11px] font-medium text-ink-2">
                        {model.name}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {SPECS.map((spec) => {
                const scores = models.map(spec.score);
                const target =
                  spec.best === "low" ? Math.min(...scores) : Math.max(...scores);
                return (
                  <tr key={spec.label}>
                    <th
                      scope="row"
                      className="whitespace-nowrap px-3 py-1.5 text-left text-[11.5px] font-normal text-ink-3"
                    >
                      {spec.hint ? (
                        <Tooltip content={spec.hint}>
                          <span className="cursor-help border-b border-dotted border-line-strong">
                            {spec.label}
                          </span>
                        </Tooltip>
                      ) : (
                        spec.label
                      )}
                    </th>
                    {models.map((model, index) => {
                      const isBest = models.length > 1 && spec.score(model) === target;
                      return (
                        <td
                          key={model.id}
                          className={cn(
                            "px-2 py-1.5 text-right font-mono text-[12px] tabular-nums",
                            isBest ? "font-semibold text-ink" : "text-ink-3",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block rounded px-1",
                              isBest && "bg-positive-soft text-positive",
                            )}
                          >
                            {spec.value(model)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr>
                <th scope="row" className="px-3 py-1.5 text-left text-[11.5px] font-normal text-ink-3">
                  Weights
                </th>
                {models.map((model) => (
                  <td key={model.id} className="px-2 py-1.5 text-right text-[11.5px] text-ink-3">
                    {model.openWeights ? "Open" : "Closed"}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="px-3 py-1.5 text-left text-[11.5px] font-normal text-ink-3">
                  Modalities
                </th>
                {models.map((model) => (
                  <td key={model.id} className="px-2 py-1.5 text-right text-[11px] capitalize text-ink-3">
                    {model.modalities.join(", ")}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <CostCalculator models={models} />

      {/* Notes side by side */}
      <section className="rounded-xl border border-line bg-surface-1 shadow-xs">
        <header className="border-b border-line-subtle px-3.5 py-2.5">
          <h3 className="text-[12.5px] font-semibold text-ink">Your notes</h3>
        </header>
        <ul className="divide-y divide-line-subtle">
          {models.map((model) => (
            <li key={model.id} className="flex gap-2.5 px-3.5 py-2.5">
              <ProviderMark provider={model.provider} size="xs" className="mt-0.5" />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-ink">{model.name}</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-3">
                  {model.notes || <span className="text-ink-4">No notes yet.</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
