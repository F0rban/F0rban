"use client";

import { useMemo, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import type { Prompt } from "@/lib/data/types";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { collapseContext, diffLines, diffStat } from "@/lib/prompts/diff";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { formatDate, relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

/**
 * Version history with a real diff.
 *
 * Two bodies side by side tells you nothing about a prompt where one rule
 * changed — the whole reason to keep history is to see what moved.
 */
export function PromptHistory({ prompt }: { prompt: Prompt }) {
  const restore = useWorkspaceStore((s) => s.restorePromptVersion);
  const toast = useUiStore((s) => s.toast);
  const [activeId, setActiveId] = useState<string>(() => prompt.versions.at(-1)?.id ?? "current");
  const [view, setView] = useState<"diff" | "full">("diff");

  const entries = useMemo(
    () => [
      {
        id: "current",
        body: prompt.body,
        createdAt: prompt.updatedAt,
        note: "Current version",
        current: true,
      },
      ...[...prompt.versions].reverse().map((v) => ({ ...v, current: false })),
    ],
    [prompt],
  );

  const active = entries.find((entry) => entry.id === activeId) ?? entries[0]!;
  const diff = useMemo(() => diffLines(active.body, prompt.body), [active.body, prompt.body]);
  const stat = useMemo(() => diffStat(diff), [diff]);
  const collapsed = useMemo(() => collapseContext(diff, 2), [diff]);

  if (prompt.versions.length === 0) {
    return (
      <EmptyState
        icon={<History />}
        title="No earlier versions yet"
        description="Every time you change the body, the previous one is kept here so you can go back — and see exactly what moved."
        compact
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <ol className="space-y-1">
        {entries.map((entry) => {
          const entryStat = entry.current
            ? null
            : diffStat(diffLines(entry.body, prompt.body));
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setActiveId(entry.id)}
                className={cn(
                  "w-full rounded-lg border px-2.5 py-2 text-left transition-colors",
                  entry.id === activeId
                    ? "border-accent-line bg-accent-soft/40"
                    : "border-line-subtle hover:border-line hover:bg-surface-2/60",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-[12px] font-medium",
                      entry.current ? "text-accent" : "text-ink-2",
                    )}
                  >
                    {entry.note}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-4">
                    {relativeTime(entry.createdAt)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-baseline gap-2 font-mono text-[10px] tabular-nums text-ink-4">
                  <span>{formatDate(entry.createdAt)}</span>
                  {entryStat && (entryStat.added > 0 || entryStat.removed > 0) && (
                    <span className="ml-auto flex gap-1.5">
                      <span className="text-positive">+{entryStat.added}</span>
                      <span className="text-negative">−{entryStat.removed}</span>
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-4">
            {active.current ? (
              "Current body"
            ) : (
              <>
                Compared with current ·{" "}
                <span className="font-mono normal-case tracking-normal text-positive">
                  +{stat.added}
                </span>{" "}
                <span className="font-mono normal-case tracking-normal text-negative">
                  −{stat.removed}
                </span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            {!active.current && (
              <Segmented
                ariaLabel="History view"
                size="sm"
                value={view}
                onChange={setView}
                options={[
                  { value: "diff", label: "Diff" },
                  { value: "full", label: "Full" },
                ]}
              />
            )}
            {!active.current && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  restore(prompt.id, active.id);
                  setActiveId("current");
                  toast({
                    title: "Version restored",
                    description: "The version you replaced was kept in history",
                    tone: "success",
                  });
                }}
              >
                <RotateCcw className="size-3" />
                Restore
              </Button>
            )}
          </div>
        </div>

        {active.current || view === "full" ? (
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-surface-2/40 p-3 font-mono text-[11.5px] leading-[1.65] text-ink-2">
            {active.body}
          </pre>
        ) : (
          <div className="max-h-96 overflow-auto rounded-lg border border-line bg-surface-2/40 py-1.5 font-mono text-[11.5px] leading-[1.6]">
            {collapsed.map((row, index) =>
              row.type === "gap" ? (
                <div
                  key={`gap-${index}`}
                  className="my-1 flex items-center gap-2 px-3 text-[10px] text-ink-4"
                >
                  <span className="h-px flex-1 bg-line-subtle" />
                  {row.count} unchanged line{row.count === 1 ? "" : "s"}
                  <span className="h-px flex-1 bg-line-subtle" />
                </div>
              ) : (
                <div
                  key={`line-${index}`}
                  className={cn(
                    "flex gap-2 px-3",
                    row.type === "add" && "bg-positive-soft/50",
                    row.type === "remove" && "bg-negative-soft/50",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "w-3 shrink-0 select-none text-center",
                      row.type === "add" && "text-positive",
                      row.type === "remove" && "text-negative",
                      row.type === "same" && "text-ink-4",
                    )}
                  >
                    {row.type === "add" ? "+" : row.type === "remove" ? "−" : " "}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 whitespace-pre-wrap break-words",
                      row.type === "add" && "text-positive",
                      row.type === "remove" && "text-negative",
                      row.type === "same" && "text-ink-3",
                    )}
                  >
                    {row.text || " "}
                  </span>
                </div>
              ),
            )}
          </div>
        )}

        <p className="mt-2 text-[11px] text-ink-4">
          {active.current
            ? "This is the body in use now."
            : "Green is what the current version added; red is what it removed."}
        </p>
      </div>
    </div>
  );
}
