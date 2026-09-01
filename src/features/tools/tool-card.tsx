"use client";

import { ExternalLink, Star } from "lucide-react";
import type { Model, Tool } from "@/lib/data/types";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { TOOL_CATEGORY_LABEL, TOOL_STATUS_LABEL, TOOL_STATUS_TONE, costPerUse } from "./tool-meta";

export function ToolCard({
  tool,
  model,
  onOpen,
  onToggleFavorite,
  now,
}: {
  tool: Tool;
  model?: Model;
  onOpen: () => void;
  onToggleFavorite: () => void;
  now: Date;
}) {
  const perUse = costPerUse(tool.monthlyCost, tool.usage30d);
  const dimmed = tool.status === "cancelled" || tool.status === "paused";

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-line bg-surface-1 shadow-xs",
        "transition-[border-color,box-shadow,transform] duration-200",
        "hover:-translate-y-px hover:border-line-strong hover:shadow-md",
        dimmed && "opacity-72",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${tool.name}`}
        className="flex flex-1 flex-col p-3.5 text-left"
      >
        <div className="flex items-start gap-2.5">
          <ProviderMark provider={tool.provider} size="md" fallbackName={tool.name} />
          <div className="min-w-0 flex-1 pr-12">
            <p className="truncate text-[13px] font-semibold tracking-[-0.005em] text-ink">
              {tool.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-ink-4">
              {TOOL_CATEGORY_LABEL[tool.category]}
              {model && ` · ${model.name}`}
            </p>
          </div>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-8 text-[12px] leading-relaxed text-ink-3">
          {tool.description}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line-subtle pt-2.5">
          <div>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-4">Cost</p>
            <p className="mt-0.5 font-mono text-[12px] font-medium tabular-nums text-ink">
              {tool.billingCycle === "usage"
                ? "Usage"
                : tool.monthlyCost > 0
                  ? `${formatCurrency(tool.monthlyCost, { maximumFractionDigits: 0 })}`
                  : "Free"}
            </p>
          </div>
          <div>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-4">30d use</p>
            <p className="mt-0.5 font-mono text-[12px] font-medium tabular-nums text-ink">
              {formatNumber(tool.usage30d)}
            </p>
          </div>
          <div>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-4">Per use</p>
            <p
              className={cn(
                "mt-0.5 font-mono text-[12px] font-medium tabular-nums",
                perUse !== null && perUse > 1.5 ? "text-warning" : "text-ink",
              )}
            >
              {perUse === null ? "—" : formatCurrency(perUse, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </button>

      <div className="flex items-center gap-2 border-t border-line-subtle px-3.5 py-2">
        <Badge tone={TOOL_STATUS_TONE[tool.status]} dot>
          {TOOL_STATUS_LABEL[tool.status]}
        </Badge>
        <span className="truncate text-[10.5px] text-ink-4">
          {tool.lastUsedAt ? `Used ${relativeTime(tool.lastUsedAt, now)}` : "Never used"}
        </span>
      </div>

      <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5">
        <Tooltip content={tool.favorite ? "Remove from starred" : "Star this tool"}>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={tool.favorite ? `Unstar ${tool.name}` : `Star ${tool.name}`}
            aria-pressed={tool.favorite}
            className={cn(
              "grid size-6 place-items-center rounded-md transition-colors",
              tool.favorite
                ? "text-accent"
                : "text-ink-4 opacity-0 hover:bg-surface-2 hover:text-ink-2 focus-visible:opacity-100 group-hover:opacity-100",
            )}
          >
            <Star className={cn("size-3.5", tool.favorite && "fill-accent")} />
          </button>
        </Tooltip>
        <Tooltip content="Open site">
          <a
            href={tool.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Open ${tool.name} website in a new tab`}
            className="grid size-6 place-items-center rounded-md text-ink-4 opacity-0 transition-colors hover:bg-surface-2 hover:text-ink-2 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </Tooltip>
      </div>
    </div>
  );
}
