"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type { Model } from "@/lib/data/types";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Textarea } from "@/components/ui/input";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Radar } from "@/components/charts/radar";
import { formatCompact, formatDuration } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/date";
import { blendedRate } from "@/lib/analytics/spend";
import { PROVIDERS } from "@/lib/data/seed/providers";
import { cn } from "@/lib/utils/cn";
import { METRIC_KEYS, METRIC_LABEL, MODALITY_LABEL } from "./model-meta";

function Spec({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[11.5px] text-ink-4">{label}</span>
      <span className="font-mono text-[12px] tabular-nums text-ink-2">{value}</span>
    </div>
  );
}

export function ModelDetail({
  model,
  open,
  onOpenChange,
}: {
  model: Model | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const scoreModel = useWorkspaceStore((s) => s.scoreModel);
  const updateModel = useWorkspaceStore((s) => s.updateModel);
  const toggleFavorite = useWorkspaceStore((s) => s.toggleModelFavorite);
  const toast = useUiStore((s) => s.toast);

  const [notes, setNotes] = useState("");
  const [score, setScore] = useState(0);

  useEffect(() => {
    setNotes(model?.notes ?? "");
    setScore(model?.personalScore ?? 0);
  }, [model?.id, model?.notes, model?.personalScore]);

  if (!model) return null;
  const dirty = notes !== model.notes || score !== (model.personalScore ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <ProviderMark provider={model.provider} size="lg" />
            <div className="min-w-0">
              <DialogTitle className="truncate text-[15px]">{model.name}</DialogTitle>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                <span>{PROVIDERS[model.provider].name}</span>
                <span className="text-ink-4">·</span>
                <span>{model.family}</span>
                <span className="text-ink-4">·</span>
                <span>Released {formatDate(model.releasedAt)}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
            <div className="divide-y divide-line-subtle">
              <Spec label="Input price" value={`$${model.inputPrice} / 1M`} />
              <Spec label="Output price" value={`$${model.outputPrice} / 1M`} />
              <Spec label="Blended (25% out)" value={`$${blendedRate(model).toFixed(2)} / 1M`} />
              <Spec label="Context window" value={formatCompact(model.contextWindow)} />
              <Spec label="Max output" value={formatCompact(model.maxOutput)} />
              <Spec label="Throughput" value={`${model.throughput} tok/s`} />
              <Spec label="Time to first token" value={formatDuration(model.latencyMs)} />
              <Spec label="Knowledge cutoff" value={model.knowledgeCutoff} />
              <Spec label="Weights" value={model.openWeights ? "Open" : "Closed"} />
            </div>
            <div className="grid place-items-center">
              <Radar
                size={220}
                axes={METRIC_KEYS.map((key) => METRIC_LABEL[key])}
                series={[
                  {
                    key: model.id,
                    label: model.name,
                    color: "var(--accent)",
                    values: METRIC_KEYS.map((key) => model.scores[key]),
                  },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {model.modalities.map((modality) => (
              <Badge key={modality} tone="outline">
                {MODALITY_LABEL[modality]}
              </Badge>
            ))}
            {model.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="model-score" className="text-[11.5px] font-medium text-ink-2">
                Your score
              </label>
              <span className="font-mono text-[15px] font-semibold tabular-nums text-ink">
                {score === 0 ? "—" : score.toFixed(1)}
              </span>
            </div>
            <input
              id="model-score"
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={score}
              onChange={(event) => setScore(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-[var(--accent)]"
              style={{
                background: `linear-gradient(to right, var(--accent) ${score * 10}%, var(--surface-3) ${score * 10}%)`,
              }}
            />
            <div className="mt-1 flex justify-between font-mono text-[9.5px] tabular-nums text-ink-4">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          <Field label="Notes" hint="What is it actually good at?" htmlFor="model-notes">
            <Textarea
              id="model-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="When would you reach for this over the alternative?"
            />
          </Field>
        </DialogBody>

        <DialogFooter className="justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite(model.id)}
            aria-pressed={model.favorite}
          >
            <Star className={cn("size-3.5", model.favorite && "fill-accent text-accent")} />
            {model.favorite ? "Starred" : "Star"}
          </Button>
          <Button
            variant={dirty ? "primary" : "secondary"}
            size="sm"
            disabled={!dirty}
            onClick={() => {
              updateModel(model.id, { notes });
              scoreModel(model.id, score === 0 ? null : score);
              toast({ title: `${model.name} updated`, tone: "success" });
            }}
          >
            {dirty ? "Save" : "Saved"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
