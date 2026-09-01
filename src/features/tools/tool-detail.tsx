"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Star, Trash2 } from "lucide-react";
import type { Model, Tool, ToolStatus } from "@/lib/data/types";
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
import { Field, Select, Textarea } from "@/components/ui/input";
import { ProviderMark } from "@/components/ui/provider-mark";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { formatDate, relativeTime } from "@/lib/utils/date";
import { PROVIDERS } from "@/lib/data/seed/providers";
import { cn } from "@/lib/utils/cn";
import {
  TOOL_CATEGORY_LABEL,
  TOOL_STATUSES,
  TOOL_STATUS_LABEL,
  TOOL_STATUS_TONE,
  costPerUse,
} from "./tool-meta";

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-line-subtle bg-surface-2/40 p-2.5">
      <p className="text-[9.5px] font-medium uppercase tracking-[0.07em] text-ink-4">{label}</p>
      <p className={cn("mt-1 font-mono text-[15px] font-semibold tabular-nums text-ink", tone)}>
        {value}
      </p>
    </div>
  );
}

export function ToolDetail({
  tool,
  model,
  open,
  onOpenChange,
}: {
  tool: Tool | null;
  model?: Model;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTool = useWorkspaceStore((s) => s.updateTool);
  const deleteTool = useWorkspaceStore((s) => s.deleteTool);
  const toggleFavorite = useWorkspaceStore((s) => s.toggleToolFavorite);
  const toast = useUiStore((s) => s.toast);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(tool?.notes ?? "");
  }, [tool?.id, tool?.notes]);

  if (!tool) return null;

  const perUse = costPerUse(tool.monthlyCost, tool.usage30d);
  const notesDirty = notes !== tool.notes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <ProviderMark provider={tool.provider} size="lg" fallbackName={tool.name} />
            <div className="min-w-0">
              <DialogTitle className="truncate text-[15px]">{tool.name}</DialogTitle>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                <Badge tone={TOOL_STATUS_TONE[tool.status]} dot>
                  {TOOL_STATUS_LABEL[tool.status]}
                </Badge>
                <span>{PROVIDERS[tool.provider].name}</span>
                <span className="text-ink-4">·</span>
                <span>{TOOL_CATEGORY_LABEL[tool.category]}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <p className="text-[13px] leading-relaxed text-ink-2">{tool.description}</p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              label="Monthly"
              value={
                tool.billingCycle === "usage"
                  ? "Usage"
                  : tool.monthlyCost > 0
                    ? formatCurrency(tool.monthlyCost)
                    : "Free"
              }
            />
            <Stat label="Sessions (30d)" value={formatNumber(tool.usage30d)} />
            <Stat
              label="Cost per use"
              value={perUse === null ? "—" : formatCurrency(perUse, { maximumFractionDigits: 2 })}
              tone={perUse !== null && perUse > 1.5 ? "text-warning" : undefined}
            />
            <Stat label="Seats" value={tool.seats} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="tool-status">
              <Select
                id="tool-status"
                value={tool.status}
                onChange={(event) => {
                  const next = event.target.value as ToolStatus;
                  updateTool(tool.id, {
                    status: next,
                    // Cancelling or pausing stops the meter — otherwise the
                    // fixed-cost total keeps counting something you dropped.
                    monthlyCost:
                      next === "cancelled" || next === "paused" ? 0 : tool.monthlyCost,
                  });
                  toast({ title: `${tool.name} → ${TOOL_STATUS_LABEL[next]}`, tone: "success" });
                }}
              >
                {TOOL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TOOL_STATUS_LABEL[status]}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="space-y-1.5">
              <p className="text-[11.5px] font-medium text-ink-2">Dates</p>
              <dl className="divide-y divide-line-subtle rounded-md border border-line-subtle">
                <div className="flex items-baseline justify-between gap-2 px-2.5 py-1.5">
                  <dt className="text-[11.5px] text-ink-4">Added</dt>
                  <dd className="font-mono text-[11.5px] tabular-nums text-ink-2">
                    {formatDate(tool.addedAt)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 px-2.5 py-1.5">
                  <dt className="text-[11.5px] text-ink-4">Last used</dt>
                  <dd className="font-mono text-[11.5px] tabular-nums text-ink-2">
                    {relativeTime(tool.lastUsedAt)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 px-2.5 py-1.5">
                  <dt className="text-[11.5px] text-ink-4">
                    {tool.status === "trial" ? "Trial ends" : "Renews"}
                  </dt>
                  <dd className="font-mono text-[11.5px] tabular-nums text-ink-2">
                    {tool.renewsOn ? formatDate(tool.renewsOn) : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <Field label="Personal notes" hint="Saved to this workspace" htmlFor="tool-notes">
            <Textarea
              id="tool-notes"
              value={notes}
              rows={4}
              placeholder="What is this actually for? What would make you cancel it?"
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>

          {tool.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tool.tags.map((tag) => (
                <Badge key={tag} tone="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(tool.id)}
              aria-pressed={tool.favorite}
            >
              <Star className={cn("size-3.5", tool.favorite && "fill-accent text-accent")} />
              {tool.favorite ? "Starred" : "Star"}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={tool.url} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="size-3.5" />
                Visit
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-negative hover:bg-negative-soft"
              onClick={() => {
                const snapshot = tool;
                deleteTool(tool.id);
                onOpenChange(false);
                toast({
                  title: `${snapshot.name} removed`,
                  tone: "warning",
                  action: {
                    label: "Undo",
                    run: () =>
                      useWorkspaceStore.getState().addTool({
                        ...snapshot,
                      } as never),
                  },
                });
              }}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>

          <Button
            variant={notesDirty ? "primary" : "secondary"}
            size="sm"
            disabled={!notesDirty}
            onClick={() => {
              updateTool(tool.id, { notes });
              toast({ title: "Notes saved", tone: "success" });
            }}
          >
            {notesDirty ? "Save notes" : "Saved"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
