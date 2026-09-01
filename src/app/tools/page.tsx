"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Boxes, LayoutGrid, List, Plus, Star } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchField } from "@/components/ui/search-field";
import { FilterMenu, FilterSummary, FilterToggle, SortMenu } from "@/components/ui/filter-bar";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Tooltip } from "@/components/ui/tooltip";
import { ToolCard } from "@/features/tools/tool-card";
import { ToolDetail } from "@/features/tools/tool-detail";
import { ToolForm } from "@/features/tools/tool-form";
import {
  TOOL_CATEGORIES,
  TOOL_CATEGORY_LABEL,
  TOOL_STATUSES,
  TOOL_STATUS_LABEL,
  TOOL_STATUS_TONE,
  costPerUse,
} from "@/features/tools/tool-meta";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { fuzzyMatch } from "@/lib/search/fuzzy";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Tool } from "@/lib/data/types";

type SortKey = "name" | "cost" | "usage" | "recent" | "efficiency";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Recently used" },
  { value: "cost", label: "Cost" },
  { value: "usage", label: "Usage" },
  { value: "efficiency", label: "Cost per use" },
  { value: "name", label: "Name" },
];

function ToolsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { workspace, ready } = useWorkspace();
  const toggleFavorite = useWorkspaceStore((s) => s.toggleToolFavorite);

  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [starredOnly, setStarredOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const tools = useMemo(() => workspace?.tools ?? [], [workspace]);
  const modelById = useMemo(
    () => new Map((workspace?.models ?? []).map((m) => [m.id, m])),
    [workspace],
  );

  // Deep links from the palette and the dashboard land on a specific tool.
  useEffect(() => {
    const toolParam = params.get("tool");
    if (toolParam) setSelectedId(toolParam);
    if (params.get("new")) setFormOpen(true);
  }, [params]);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    if (params.get("tool")) router.replace("/tools");
  }, [params, router]);

  const filtered = useMemo(() => {
    const list = tools.filter((tool) => {
      if (statuses.length && !statuses.includes(tool.status)) return false;
      if (categories.length && !categories.includes(tool.category)) return false;
      if (starredOnly && !tool.favorite) return false;
      return true;
    });

    if (query.trim()) {
      const scored = list
        .map((tool) => {
          const match =
            fuzzyMatch(query, tool.name) ??
            fuzzyMatch(query, `${tool.description} ${tool.tags.join(" ")} ${tool.notes}`);
          return match ? { tool, score: match.score } : null;
        })
        .filter((row): row is { tool: Tool; score: number } => row !== null)
        .sort((a, b) => b.score - a.score);
      return scored.map((row) => row.tool);
    }

    return [...list].sort((a, b) => {
      switch (sort) {
        case "cost":
          return b.monthlyCost - a.monthlyCost;
        case "usage":
          return b.usage30d - a.usage30d;
        case "efficiency":
          return (costPerUse(b.monthlyCost, b.usage30d) ?? -1) - (costPerUse(a.monthlyCost, a.usage30d) ?? -1);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "");
      }
    });
  }, [tools, statuses, categories, starredOnly, query, sort]);

  const stats = useMemo(() => {
    const active = tools.filter((t) => t.status === "active");
    return {
      monthly: active.reduce((sum, t) => sum + t.monthlyCost, 0),
      active: active.length,
      trials: tools.filter((t) => t.status === "trial").length,
      annualised: active.reduce((sum, t) => sum + t.monthlyCost, 0) * 12,
    };
  }, [tools]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tool of tools) counts.set(tool.status, (counts.get(tool.status) ?? 0) + 1);
    return counts;
  }, [tools]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tool of tools) counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
    return counts;
  }, [tools]);

  const filtersActive = Boolean(statuses.length || categories.length || starredOnly || query);
  const selected = tools.find((t) => t.id === selectedId) ?? null;

  return (
    <PageContainer>
      <PageHeader
        title="Tools"
        description="Every AI subscription and API you pay for, with what it costs and whether you actually use it."
        meta={
          ready ? (
            <>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatCurrency(stats.monthly, { maximumFractionDigits: 0 })}
                </span>{" "}
                / month fixed
              </span>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatCurrency(stats.annualised, { maximumFractionDigits: 0 })}
                </span>{" "}
                / year
              </span>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">{stats.active}</span>{" "}
                active
              </span>
              {stats.trials > 0 && (
                <Badge tone="accent" dot>
                  {stats.trials} in trial
                </Badge>
              )}
            </>
          ) : (
            <Skeleton className="h-4 w-64" />
          )
        }
        actions={
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-3.5" strokeWidth={2.4} />
            Add tool
          </Button>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search tools, tags and notes…"
          resultCount={filtered.length}
          className="min-w-48 basis-full sm:basis-64"
        />
        <FilterMenu
          label="Status"
          selected={statuses}
          onChange={setStatuses}
          options={TOOL_STATUSES.map((s) => ({
            value: s,
            label: TOOL_STATUS_LABEL[s],
            count: statusCounts.get(s) ?? 0,
          }))}
        />
        <FilterMenu
          label="Category"
          selected={categories}
          onChange={setCategories}
          options={TOOL_CATEGORIES.filter((c) => categoryCounts.has(c)).map((c) => ({
            value: c,
            label: TOOL_CATEGORY_LABEL[c],
            count: categoryCounts.get(c) ?? 0,
          }))}
        />
        <FilterToggle active={starredOnly} onClick={() => setStarredOnly((v) => !v)}>
          <Star className={cn("size-3.5", starredOnly && "fill-accent")} />
          Starred
        </FilterToggle>
        <div className="ml-auto flex items-center gap-2">
          <SortMenu options={SORTS} value={sort} onChange={setSort} className="hidden sm:inline-flex" />
          <Segmented
            ariaLabel="View mode"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: "", icon: <LayoutGrid className="size-3.5" /> },
              { value: "table", label: "", icon: <List className="size-3.5" /> },
            ]}
            className="w-[68px]"
          />
        </div>
      </div>

      <div className="mt-2.5">
        <FilterSummary
          shown={filtered.length}
          total={tools.length}
          noun="tools"
          active={filtersActive}
          onReset={() => {
            setQuery("");
            setStatuses([]);
            setCategories([]);
            setStarredOnly(false);
          }}
        />
      </div>

      {!ready ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-3"
          icon={<Boxes />}
          title="No tools match those filters"
          description="Try clearing a filter, or add the tool you were looking for."
          action={
            <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              Add tool
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="stack-in mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              model={tool.primaryModelId ? modelById.get(tool.primaryModelId) : undefined}
              now={now}
              onOpen={() => setSelectedId(tool.id)}
              onToggleFavorite={() => toggleFavorite(tool.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface-1">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left">
              <thead>
                <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.07em] text-ink-4">
                  <th scope="col" className="px-3 py-2 font-medium">Tool</th>
                  <th scope="col" className="px-3 py-2 font-medium">Status</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Monthly</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">30d use</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Per use</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Last used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {filtered.map((tool) => {
                  const perUse = costPerUse(tool.monthlyCost, tool.usage30d);
                  return (
                    <tr
                      key={tool.id}
                      onClick={() => setSelectedId(tool.id)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") setSelectedId(tool.id);
                      }}
                      className="cursor-pointer transition-colors hover:bg-surface-2/60 focus-visible:bg-surface-2"
                    >
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2.5">
                          <ProviderMark provider={tool.provider} size="sm" fallbackName={tool.name} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[12.5px] font-medium text-ink">
                                {tool.name}
                              </span>
                              {tool.favorite && (
                                <Star className="size-3 shrink-0 fill-accent text-accent" />
                              )}
                            </span>
                            <span className="block truncate text-[11px] text-ink-4">
                              {TOOL_CATEGORY_LABEL[tool.category]}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={TOOL_STATUS_TONE[tool.status]} dot>
                          {TOOL_STATUS_LABEL[tool.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-ink-2">
                        {tool.billingCycle === "usage"
                          ? "usage"
                          : tool.monthlyCost > 0
                            ? formatCurrency(tool.monthlyCost)
                            : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-ink-2">
                        {formatNumber(tool.usage30d)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-mono text-[12px] tabular-nums",
                          perUse !== null && perUse > 1.5 ? "text-warning" : "text-ink-2",
                        )}
                      >
                        {perUse === null ? "—" : formatCurrency(perUse, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11.5px] tabular-nums text-ink-4">
                        <Tooltip content={tool.lastUsedAt ? new Date(tool.lastUsedAt).toLocaleString() : "Never"}>
                          <span>{relativeTime(tool.lastUsedAt, now)}</span>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ToolDetail
        tool={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && closeDetail()}
      />
      <ToolForm open={formOpen} onOpenChange={setFormOpen} />
    </PageContainer>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolsPageInner />
    </Suspense>
  );
}
