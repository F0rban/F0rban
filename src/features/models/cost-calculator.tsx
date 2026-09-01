"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import type { Model } from "@/lib/data/types";
import { estimateCost, estimateLatency } from "@/lib/analytics/spend";
import { formatCompact, formatCurrency, formatDuration } from "@/lib/utils/format";
import { Segmented } from "@/components/ui/segmented";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { compareColor } from "./model-meta";

type PresetKey = "chat" | "summary" | "review" | "classify" | "custom";

const PRESETS: Record<Exclude<PresetKey, "custom">, { tokensIn: number; tokensOut: number; requestsPerDay: number }> = {
  chat: { tokensIn: 1_200, tokensOut: 400, requestsPerDay: 120 },
  summary: { tokensIn: 48_000, tokensOut: 900, requestsPerDay: 40 },
  review: { tokensIn: 9_000, tokensOut: 1_400, requestsPerDay: 25 },
  classify: { tokensIn: 800, tokensOut: 40, requestsPerDay: 5_000 },
};

/**
 * Turns list prices into the only number that matters: what this workload
 * costs per month on each candidate model.
 */
export function CostCalculator({ models }: { models: Model[] }) {
  const [preset, setPreset] = useState<PresetKey>("chat");
  const [inputs, setInputs] = useState(PRESETS.chat);

  const applyPreset = (key: PresetKey) => {
    setPreset(key);
    if (key !== "custom") setInputs(PRESETS[key]);
  };

  const update = (patch: Partial<typeof inputs>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
    setPreset("custom");
  };

  const estimates = models.map((model) => ({
    model,
    cost: estimateCost(model, inputs),
    latency: estimateLatency(model, inputs.tokensOut),
  }));
  const cheapest = Math.min(...estimates.map((e) => e.cost.perMonth));
  const fastest = Math.min(...estimates.map((e) => e.latency));

  return (
    <section className="rounded-xl border border-line bg-surface-1 shadow-xs">
      <header className="flex items-center gap-2 border-b border-line-subtle px-3.5 py-2.5">
        <Calculator className="size-3.5 text-ink-4" />
        <h3 className="text-[12.5px] font-semibold text-ink">Workload cost</h3>
        <span className="ml-auto font-mono text-[10.5px] tabular-nums text-ink-4">
          {formatCompact(inputs.requestsPerDay * 30)} calls/mo
        </span>
      </header>

      <div className="space-y-3 p-3.5">
        <Segmented
          ariaLabel="Workload preset"
          size="sm"
          className="w-full"
          value={preset === "custom" ? "chat" : preset}
          onChange={(value) => applyPreset(value as PresetKey)}
          options={[
            { value: "chat", label: "Chat" },
            { value: "summary", label: "Summarise" },
            { value: "review", label: "Review" },
            { value: "classify", label: "Classify" },
          ]}
        />

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["tokensIn", "Tokens in"],
              ["tokensOut", "Tokens out"],
              ["requestsPerDay", "Calls / day"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-4">
                {label}
              </span>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={inputs[key]}
                aria-label={label}
                onChange={(event) => update({ [key]: Math.max(0, Number(event.target.value) || 0) })}
                className="h-7 px-2 font-mono text-[12px]"
              />
            </label>
          ))}
        </div>

        <ul className="space-y-1.5">
          {estimates.map(({ model, cost, latency }, index) => {
            const isCheapest = cost.perMonth === cheapest && estimates.length > 1;
            const isFastest = latency === fastest && estimates.length > 1;
            const relative = cheapest > 0 ? cost.perMonth / cheapest : 1;
            return (
              <li key={model.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="size-1.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: compareColor(index) }}
                    />
                    <span className="truncate text-[12px] text-ink-2">{model.name}</span>
                    {isCheapest && (
                      <span className="shrink-0 rounded-[3px] bg-positive-soft px-1 text-[9.5px] font-medium text-positive">
                        cheapest
                      </span>
                    )}
                    {isFastest && !isCheapest && (
                      <span className="shrink-0 rounded-[3px] bg-info-soft px-1 text-[9.5px] font-medium text-info">
                        fastest
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-[12.5px] font-medium tabular-nums text-ink">
                    {formatCurrency(cost.perMonth, { maximumFractionDigits: cost.perMonth < 10 ? 2 : 0 })}
                    <span className="text-[10px] font-normal text-ink-4">/mo</span>
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full transition-[width] duration-400 ease-[var(--ease-out-quint)]"
                      style={{
                        width: `${Math.max(2, (cheapest / Math.max(cost.perMonth, 0.0001)) * 100)}%`,
                        backgroundColor: compareColor(index),
                      }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right font-mono text-[10px] tabular-nums text-ink-4">
                    {relative > 1.05 ? `${relative.toFixed(1)}×` : "baseline"} ·{" "}
                    {formatDuration(latency)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {estimates.length > 1 && (
          <p className="border-t border-line-subtle pt-2.5 text-[11px] leading-relaxed text-ink-4">
            At this volume the spread is{" "}
            <span
              className={cn(
                "font-mono font-medium",
                Math.max(...estimates.map((e) => e.cost.perMonth)) / Math.max(cheapest, 0.0001) > 5
                  ? "text-warning"
                  : "text-ink-3",
              )}
            >
              {formatCurrency(
                Math.max(...estimates.map((e) => e.cost.perMonth)) - cheapest,
                { maximumFractionDigits: 0 },
              )}
            </span>{" "}
            per month between the cheapest and the most expensive option.
          </p>
        )}
      </div>
    </section>
  );
}
