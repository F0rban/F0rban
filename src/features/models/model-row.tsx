"use client";

import { Check, Star } from "lucide-react";
import type { Model } from "@/lib/data/types";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCompact, formatDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { METRIC_KEYS, compareColor } from "./model-meta";
import type { Standing } from "@/lib/analytics/verdicts";
import { FormStrip, RecordScore, TALLY_LIMIT, TallyMarks } from "@/components/ui/record";

/** Five-bar capability glyph. Reads as a shape before it reads as data. */
function ScoreBars({ model }: { model: Model }) {
  return (
    <span className="inline-flex h-4 items-end gap-[2px]" aria-hidden>
      {METRIC_KEYS.map((key) => (
        <span
          key={key}
          className="w-[3px] rounded-[1px] bg-ink-4/70"
          style={{ height: `${Math.max(12, model.scores[key])}%` }}
        />
      ))}
    </span>
  );
}

export function ModelRow({
  model,
  record,
  strengths,
  selected,
  selectionIndex,
  disabled,
  onToggleSelect,
  onOpen,
  onToggleFavorite,
}: {
  model: Model;
  /** The model's record in your own duels. Null if it never entered one. */
  record: Standing | null;
  /** Task types this model is the recommendation for. */
  strengths: string[];
  selected: boolean;
  selectionIndex: number;
  disabled: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line-subtle px-3 py-2.5",
        "transition-colors duration-150 last:border-b-0",
        selected ? "bg-accent-soft/30" : "hover:bg-surface-2/60",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`Compare ${model.name}`}
        disabled={disabled && !selected}
        onClick={onToggleSelect}
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-all duration-150",
          selected
            ? "border-transparent text-white"
            : "border-line-strong hover:border-accent disabled:opacity-30 disabled:hover:border-line-strong",
        )}
        style={selected ? { backgroundColor: compareColor(selectionIndex) } : undefined}
      >
        {selected && <Check className="size-3" strokeWidth={3.5} />}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-2.5 text-left sm:grid-cols-[auto_minmax(0,1fr)_auto]"
      >
        <ProviderMark provider={model.provider} size="sm" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[12.5px] font-medium text-ink">{model.name}</span>
            {model.favorite && <Star className="size-3 shrink-0 fill-accent text-accent" />}
            {strengths.length > 0 && (
              <span
                className="hidden shrink-0 rounded-[3px] bg-accent-soft px-1 text-[9.5px] font-medium text-accent sm:inline"
                title={`Recommended for ${strengths.join(", ").replace(/-/g, " ")}`}
              >
                your pick for {strengths.length}
              </span>
            )}
            {model.openWeights && (
              <span className="hidden shrink-0 rounded-[3px] border border-line px-1 text-[9px] font-medium uppercase tracking-wide text-ink-4 sm:inline">
                open
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[10.5px] tabular-nums text-ink-4">
            ${model.inputPrice} / ${model.outputPrice} per M · {formatCompact(model.contextWindow)} ctx ·{" "}
            {formatDuration(model.latencyMs)} TTFT
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-3">
        {/* Your record leads; the vendor's capability glyph follows it. That
            ordering is the whole argument of the product. */}
        {record && record.played > 0 ? (
          <Tooltip
            content={
              <span className="block">
                {record.wins} won, {record.losses} lost
                {record.ties ? `, ${record.ties} tied` : ""} across {record.played} of your duels
              </span>
            }
          >
            <span className="hidden items-center gap-2 sm:flex">
              {/* Strokes while a count is small enough to read as strokes;
                  past that the score alone carries it, without a bare number
                  sitting beside the same number. */}
              {record.wins <= TALLY_LIMIT && (
                <TallyMarks count={record.wins} label={`${record.wins} wins`} />
              )}
              <RecordScore wins={record.wins} losses={record.losses} ties={record.ties} size="sm" />
              <FormStrip form={record.form} />
            </span>
          </Tooltip>
        ) : (
          <span className="hidden text-[10.5px] text-ink-4 sm:block">no duels yet</span>
        )}

        <Tooltip
          content={
            <span className="block space-y-0.5">
              {METRIC_KEYS.map((key) => (
                <span key={key} className="flex justify-between gap-4 capitalize">
                  {key}
                  <span className="font-mono tabular-nums">{model.scores[key]}</span>
                </span>
              ))}
            </span>
          }
        >
          <span className="hidden sm:block">
            <ScoreBars model={model} />
          </span>
        </Tooltip>

        <span className="w-9 text-right font-mono text-[12.5px] font-medium tabular-nums text-ink">
          {model.personalScore === null ? (
            <span className="text-ink-4">—</span>
          ) : (
            model.personalScore.toFixed(1)
          )}
        </span>

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={model.favorite ? `Unstar ${model.name}` : `Star ${model.name}`}
          aria-pressed={model.favorite}
          className={cn(
            "grid size-6 place-items-center rounded-md transition-colors",
            model.favorite
              ? "text-accent"
              : "text-ink-4 opacity-0 hover:bg-surface-2 hover:text-ink-2 focus-visible:opacity-100 group-hover:opacity-100",
          )}
        >
          <Star className={cn("size-3.5", model.favorite && "fill-accent")} />
        </button>
      </div>
    </div>
  );
}
