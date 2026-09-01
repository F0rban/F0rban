"use client";

import { useState } from "react";
import { History, RotateCcw } from "lucide-react";
import type { Prompt } from "@/lib/data/types";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

/** Version history. Current is always first and cannot be restored onto itself. */
export function PromptHistory({ prompt }: { prompt: Prompt }) {
  const restore = useWorkspaceStore((s) => s.restorePromptVersion);
  const toast = useUiStore((s) => s.toast);
  const [activeId, setActiveId] = useState<string>("current");

  const entries = [
    {
      id: "current",
      body: prompt.body,
      createdAt: prompt.updatedAt,
      note: "Current version",
      current: true,
    },
    ...[...prompt.versions].reverse().map((v) => ({ ...v, current: false })),
  ];

  if (prompt.versions.length === 0) {
    return (
      <EmptyState
        icon={<History />}
        title="No earlier versions yet"
        description="Every time you change the body, the previous one is kept here so you can go back."
        compact
      />
    );
  }

  const active = entries.find((entry) => entry.id === activeId) ?? entries[0]!;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <ol className="space-y-1">
        {entries.map((entry) => (
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
              <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-ink-4">
                {formatDate(entry.createdAt)} · {entry.body.length} chars
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-4">
            {active.current ? "Current body" : "Version body"}
          </p>
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
              Restore this version
            </Button>
          )}
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-surface-2/40 p-3 font-mono text-[11.5px] leading-[1.65] text-ink-2">
          {active.body}
        </pre>
      </div>
    </div>
  );
}
