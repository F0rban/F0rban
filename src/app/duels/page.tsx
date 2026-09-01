"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EqualApproximately, Gavel, Swords, Trophy } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchField } from "@/components/ui/search-field";
import { FilterMenu, FilterSummary } from "@/components/ui/filter-bar";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderMark } from "@/components/ui/provider-mark";
import { useWorkspace } from "@/hooks/use-workspace";
import { matchesQuery } from "@/lib/search";
import { TASK_LABEL, TASK_TYPES } from "@/lib/data/seed/duels";
import { costSpread } from "@/features/duels/duel-meta";
import { formatCurrency } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

type View = "all" | "pending" | "decided";

export default function DuelsPage() {
  const { workspace, ready } = useWorkspace();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");
  const [taskFilter, setTaskFilter] = useState<string[]>([]);

  const now = useMemo(() => new Date(), []);
  const duels = useMemo(() => workspace?.duels ?? [], [workspace]);
  const models = useMemo(
    () => new Map((workspace?.models ?? []).map((m) => [m.id, m])),
    [workspace],
  );

  const pending = duels.filter((d) => d.status === "pending");

  const filtered = useMemo(() => {
    return duels
      .filter((duel) => {
        if (view === "pending" && duel.status !== "pending") return false;
        if (view === "decided" && duel.status !== "decided") return false;
        if (taskFilter.length && !taskFilter.includes(duel.taskType)) return false;
        return matchesQuery(
          query,
          duel.title,
          duel.reason,
          TASK_LABEL[duel.taskType],
          duel.entries.map((e) => models.get(e.modelId)?.name ?? "").join(" "),
        );
      })
      // Anything awaiting a verdict comes first: it is the only thing here
      // with an action attached.
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [duels, view, taskFilter, query, models]);

  const filtersActive = Boolean(query || taskFilter.length || view !== "all");

  return (
    <PageContainer>
      <PageHeader
        title="Duels"
        description="Every head-to-head you have judged. This is the evidence the verdicts are computed from."
        meta={
          ready ? (
            <>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">{duels.length}</span>{" "}
                run
              </span>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {duels.filter((d) => d.status === "decided").length}
                </span>{" "}
                judged
              </span>
              {pending.length > 0 && (
                <Badge tone="accent" dot>
                  {pending.length} awaiting a verdict
                </Badge>
              )}
            </>
          ) : (
            <Skeleton className="h-4 w-52" />
          )
        }
        actions={
          <Button variant="primary" size="sm" asChild>
            <Link href="/duels/new">
              <Swords className="size-3.5" />
              Run a duel
            </Link>
          </Button>
        }
      />

      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:overflow-visible sm:pb-0">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search duels…"
          resultCount={filtered.length}
          className="w-56 min-w-48 shrink-0 sm:basis-64"
        />
        <Segmented
          ariaLabel="Status"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "all", label: "All" },
            { value: "pending", label: `Waiting${pending.length ? ` ${pending.length}` : ""}` },
            { value: "decided", label: "Judged" },
          ]}
        />
        <FilterMenu
          label="Kind of work"
          selected={taskFilter}
          onChange={setTaskFilter}
          options={TASK_TYPES.map((type) => ({
            value: type,
            label: TASK_LABEL[type],
            count: duels.filter((d) => d.taskType === type).length,
          })).filter((option) => (option.count ?? 0) > 0)}
        />
      </div>

      <div className="mt-2.5">
        <FilterSummary
          shown={filtered.length}
          total={duels.length}
          noun="duels"
          active={filtersActive}
          onReset={() => {
            setQuery("");
            setTaskFilter([]);
            setView("all");
          }}
        />
      </div>

      {!ready ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-3"
          icon={<Gavel />}
          title={duels.length === 0 ? "No duels yet" : "Nothing matches"}
          description={
            duels.length === 0
              ? "A duel is one real task run against several models and judged blind. Five of them is enough to start seeing a pattern."
              : "Clear a filter, or run a new comparison."
          }
          action={
            <Button variant="primary" size="sm" asChild>
              <Link href="/duels/new">Run a duel</Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-3 overflow-hidden rounded-xl border border-line bg-surface-1 shadow-xs">
          {filtered.map((duel) => {
            const winner = duel.winnerModelId ? models.get(duel.winnerModelId) : null;
            const spread = costSpread(duel);
            const isPending = duel.status === "pending";
            return (
              <li key={duel.id} className="border-b border-line-subtle last:border-b-0">
                <Link
                  href={`/duels/${duel.id}`}
                  className={cn(
                    "group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 transition-colors",
                    "hover:bg-surface-2/60 sm:grid-cols-[auto_1fr_minmax(0,12rem)_auto]",
                    isPending && "bg-accent-soft/25",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-lg border",
                      isPending
                        ? "border-accent-line bg-accent-soft text-accent"
                        : duel.tie
                          ? "border-line bg-surface-2 text-ink-4"
                          : "border-line bg-surface-2 text-accent",
                    )}
                  >
                    {isPending ? (
                      <Gavel className="size-3.5" />
                    ) : duel.tie ? (
                      <EqualApproximately className="size-3.5" />
                    ) : (
                      <Trophy className="size-3.5" />
                    )}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-ink">
                      {duel.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-ink-4">
                      {TASK_LABEL[duel.taskType]}
                      {duel.reason ? ` · ${duel.reason}` : ""}
                    </span>
                  </span>

                  <span className="hidden min-w-0 items-center gap-1.5 sm:flex">
                    {isPending ? (
                      <Badge tone="accent">Judge this</Badge>
                    ) : duel.tie ? (
                      <span className="text-[11.5px] text-ink-4">Indistinguishable</span>
                    ) : (
                      <>
                        <ProviderMark provider={winner?.provider ?? "other"} size="xs" />
                        <span className="truncate text-[11.5px] text-ink-2">{winner?.name}</span>
                      </>
                    )}
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-[10.5px] tabular-nums text-ink-4">
                      {relativeTime(duel.createdAt, now)}
                    </span>
                    {!isPending && spread.ratio > 1.2 && (
                      <span className="block font-mono text-[10.5px] tabular-nums text-ink-4">
                        {formatCurrency(spread.dearest - spread.cheapest, {
                          maximumFractionDigits: 3,
                        })}{" "}
                        apart
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
