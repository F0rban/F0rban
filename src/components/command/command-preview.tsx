"use client";

import { Star } from "lucide-react";
import type { CommandAction } from "./commands";
import type { SearchHit } from "@/lib/search";
import type { Workspace } from "@/lib/data/types";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type Row =
  | { kind: "command"; id: string; command: CommandAction; positions: number[] }
  | { kind: "record"; id: string; hit: SearchHit };

function Row_({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="shrink-0 text-[11px] text-ink-4">{label}</span>
      <span className="truncate text-right font-mono text-[11.5px] tabular-nums text-ink-2">
        {value}
      </span>
    </div>
  );
}

/**
 * Preview pane for the highlighted result.
 *
 * The point is that the palette can answer a question — "what does Opus cost?",
 * "when did I last use this prompt?" — without the user leaving the keyboard.
 */
export function CommandPreview({
  row,
  workspace,
  className,
}: {
  row: Row | undefined;
  workspace: Workspace | null;
  className?: string;
}) {
  if (!row || !workspace) {
    return <aside className={cn("hidden w-64 shrink-0 border-l border-line lg:block", className)} />;
  }

  if (row.kind === "command") {
    const { command } = row;
    return (
      <aside className={cn("hidden w-64 shrink-0 border-l border-line p-4 lg:block", className)}>
        <span className="grid size-8 place-items-center rounded-lg border border-line bg-surface-2 text-ink-3">
          <command.icon className="size-4" />
        </span>
        <p className="mt-3 text-[13px] font-medium text-ink">{command.label}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-4">{command.group} action</p>
      </aside>
    );
  }

  const { hit } = row;
  const body = (() => {
    switch (hit.type) {
      case "model": {
        const model = workspace.models.find((m) => m.id === hit.id);
        if (!model) return null;
        return (
          <>
            <header className="flex items-start gap-2.5">
              <ProviderMark provider={model.provider} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">{model.name}</p>
                <p className="truncate text-[11px] text-ink-4">{model.family}</p>
              </div>
            </header>
            <div className="mt-3 divide-y divide-line-subtle border-y border-line-subtle">
              <Row_ label="Input" value={`$${model.inputPrice}/M`} />
              <Row_ label="Output" value={`$${model.outputPrice}/M`} />
              <Row_ label="Context" value={formatCompact(model.contextWindow)} />
              <Row_ label="Throughput" value={`${model.throughput} tok/s`} />
              <Row_ label="Your score" value={model.personalScore?.toFixed(1) ?? "—"} />
            </div>
            {model.notes && (
              <p className="mt-3 text-[11.5px] leading-relaxed text-ink-3">{model.notes}</p>
            )}
          </>
        );
      }
      case "tool": {
        const tool = workspace.tools.find((t) => t.id === hit.id);
        if (!tool) return null;
        return (
          <>
            <header className="flex items-start gap-2.5">
              <ProviderMark provider={tool.provider} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">{tool.name}</p>
                <p className="truncate text-[11px] capitalize text-ink-4">{tool.category}</p>
              </div>
            </header>
            <div className="mt-3 divide-y divide-line-subtle border-y border-line-subtle">
              <Row_ label="Status" value={<span className="capitalize">{tool.status}</span>} />
              <Row_
                label="Cost"
                value={tool.billingCycle === "usage" ? "Usage-based" : `${formatCurrency(tool.monthlyCost)}/mo`}
              />
              <Row_ label="Used (30d)" value={formatNumber(tool.usage30d)} />
              <Row_ label="Last used" value={relativeTime(tool.lastUsedAt)} />
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-3">{tool.description}</p>
          </>
        );
      }
      case "prompt": {
        const prompt = workspace.prompts.find((p) => p.id === hit.id);
        if (!prompt) return null;
        return (
          <>
            <header>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium leading-snug text-ink">{prompt.title}</p>
                {prompt.favorite && <Star className="mt-0.5 size-3 shrink-0 fill-accent text-accent" />}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Badge tone="outline" className="capitalize">{prompt.category}</Badge>
                {prompt.variables.length > 0 && (
                  <Badge tone="accent">{prompt.variables.length} vars</Badge>
                )}
              </div>
            </header>
            <div className="mt-3 divide-y divide-line-subtle border-y border-line-subtle">
              <Row_ label="Used" value={`${formatNumber(prompt.useCount)}×`} />
              <Row_ label="Last used" value={relativeTime(prompt.lastUsedAt)} />
              <Row_ label="Versions" value={prompt.versions.length + 1} />
            </div>
            <pre className="mt-3 max-h-32 overflow-hidden whitespace-pre-wrap break-words font-mono text-[10.5px] leading-relaxed text-ink-4">
              {prompt.body.slice(0, 260)}
              {prompt.body.length > 260 ? "…" : ""}
            </pre>
          </>
        );
      }
      case "project": {
        const project = workspace.projects.find((p) => p.id === hit.id);
        if (!project) return null;
        const done = project.tasks.filter((t) => t.done).length;
        return (
          <>
            <header>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-[5px] border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold"
                  style={{
                    color: `var(--series-${project.series})`,
                    borderColor: `color-mix(in oklch, var(--series-${project.series}) 34%, transparent)`,
                    backgroundColor: `color-mix(in oklch, var(--series-${project.series}) 12%, transparent)`,
                  }}
                >
                  {project.code}
                </span>
                <Badge tone="outline" className="capitalize">{project.status}</Badge>
              </div>
              <p className="mt-2 text-[13px] font-medium leading-snug text-ink">{project.name}</p>
            </header>
            <div className="mt-3 divide-y divide-line-subtle border-y border-line-subtle">
              <Row_ label="Tasks" value={`${done}/${project.tasks.length}`} />
              <Row_ label="Budget" value={project.budget ? `${formatCurrency(project.budget)}/mo` : "—"} />
              <Row_ label="Tools" value={project.toolIds.length} />
              <Row_ label="Updated" value={relativeTime(project.updatedAt)} />
            </div>
            <p className="mt-3 line-clamp-4 text-[11.5px] leading-relaxed text-ink-3">
              {project.description}
            </p>
          </>
        );
      }
      default:
        return null;
    }
  })();

  return (
    <aside
      className={cn(
        "hidden w-64 shrink-0 overflow-y-auto border-l border-line p-4 lg:block",
        className,
      )}
    >
      {body}
    </aside>
  );
}
