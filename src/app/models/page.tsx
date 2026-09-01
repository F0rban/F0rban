"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cpu, Scale, Star, X } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchField } from "@/components/ui/search-field";
import { FilterMenu, FilterSummary, FilterToggle, SortMenu } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModelRow } from "@/features/models/model-row";
import { ModelDetail } from "@/features/models/model-detail";
import { ComparisonPanel } from "@/features/models/comparison-panel";
import { MAX_COMPARE, MODALITIES, MODALITY_LABEL } from "@/features/models/model-meta";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { fuzzyMatch } from "@/lib/search/fuzzy";
import { matchesQuery } from "@/lib/search";
import { blendedRate } from "@/lib/analytics/spend";
import { PROVIDERS } from "@/lib/data/seed/providers";
import { formatCompact } from "@/lib/utils/format";
import type { Model } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";

type SortKey = "score" | "cheapest" | "fastest" | "context" | "newest" | "name";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "score", label: "Your score" },
  { value: "cheapest", label: "Cheapest" },
  { value: "fastest", label: "Fastest" },
  { value: "context", label: "Largest context" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name" },
];

function ModelsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { workspace, ready } = useWorkspace();
  const toggleFavorite = useWorkspaceStore((s) => s.toggleModelFavorite);

  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);
  const [openOnly, setOpenOnly] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("score");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mobileCompareOpen, setMobileCompareOpen] = useState(false);

  const models = useMemo(() => workspace?.models ?? [], [workspace]);

  // Open the comparison on the user's starred models the first time through.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || models.length === 0) return;
    const starred = models.filter((m) => m.favorite).slice(0, 3).map((m) => m.id);
    if (starred.length >= 2) setCompareIds(starred);
    setSeeded(true);
  }, [models, seeded]);

  useEffect(() => {
    const modelParam = params.get("model");
    if (modelParam) setDetailId(modelParam);
  }, [params]);

  const closeDetail = useCallback(() => {
    setDetailId(null);
    if (params.get("model")) router.replace("/models");
  }, [params, router]);

  const toggleCompare = (id: string) =>
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, id],
    );

  const filtered = useMemo(() => {
    const list = models.filter((model) => {
      if (providers.length && !providers.includes(model.provider)) return false;
      if (modalities.length && !modalities.some((m) => model.modalities.includes(m as never)))
        return false;
      if (openOnly && !model.openWeights) return false;
      if (starredOnly && !model.favorite) return false;
      return true;
    });

    if (query.trim()) {
      return list
        .filter((model) =>
          matchesQuery(query, model.name, model.family, model.tags.join(" "), model.notes),
        )
        .map((model) => ({ model, score: fuzzyMatch(query, model.name)?.score ?? 0 }))
        .sort((a, b) => b.score - a.score || a.model.name.localeCompare(b.model.name))
        .map((row) => row.model);
    }

    return [...list].sort((a, b) => {
      switch (sort) {
        case "cheapest":
          return blendedRate(a) - blendedRate(b);
        case "fastest":
          return a.latencyMs - b.latencyMs;
        case "context":
          return b.contextWindow - a.contextWindow;
        case "newest":
          return b.releasedAt.localeCompare(a.releasedAt);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return (b.personalScore ?? -1) - (a.personalScore ?? -1);
      }
    });
  }, [models, providers, modalities, openOnly, starredOnly, query, sort]);

  const selectedModels = compareIds
    .map((id) => models.find((m) => m.id === id))
    .filter((m): m is Model => Boolean(m));

  const providerCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const model of models) counts.set(model.provider, (counts.get(model.provider) ?? 0) + 1);
    return counts;
  }, [models]);

  const stats = useMemo(() => {
    if (!models.length) return null;
    const cheapest = [...models].sort((a, b) => blendedRate(a) - blendedRate(b))[0]!;
    const largest = [...models].sort((a, b) => b.contextWindow - a.contextWindow)[0]!;
    return { cheapest, largest, count: models.length };
  }, [models]);

  const filtersActive = Boolean(
    providers.length || modalities.length || openOnly || starredOnly || query,
  );

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Model Lab"
        description="Capability, price and latency side by side — with what your own workload would actually cost on each."
        meta={
          ready && stats ? (
            <>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">{stats.count}</span>{" "}
                models tracked
              </span>
              <span className="text-[12.5px] text-ink-3">
                Cheapest blended{" "}
                <span className="font-mono font-semibold text-ink">{stats.cheapest.name}</span>{" "}
                <span className="font-mono tabular-nums text-ink-4">
                  ${blendedRate(stats.cheapest).toFixed(2)}/M
                </span>
              </span>
              <span className="text-[12.5px] text-ink-3">
                Largest context{" "}
                <span className="font-mono font-semibold text-ink">
                  {formatCompact(stats.largest.contextWindow)}
                </span>
              </span>
            </>
          ) : (
            <Skeleton className="h-4 w-72" />
          )
        }
        actions={
          selectedModels.length > 0 ? (
            <Button
              variant="primary"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileCompareOpen(true)}
            >
              <Scale className="size-3.5" />
              Compare {selectedModels.length}
            </Button>
          ) : null
        }
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search models…"
              resultCount={filtered.length}
              className="min-w-40 basis-full sm:basis-52"
            />
            <FilterMenu
              label="Provider"
              selected={providers}
              onChange={setProviders}
              options={[...providerCounts.keys()].map((id) => ({
                value: id,
                label: PROVIDERS[id as keyof typeof PROVIDERS]?.name ?? id,
                count: providerCounts.get(id),
              }))}
            />
            <FilterMenu
              label="Modality"
              selected={modalities}
              onChange={setModalities}
              options={MODALITIES.map((m) => ({ value: m, label: MODALITY_LABEL[m] }))}
            />
            <FilterToggle active={openOnly} onClick={() => setOpenOnly((v) => !v)}>
              Open weights
            </FilterToggle>
            <FilterToggle active={starredOnly} onClick={() => setStarredOnly((v) => !v)}>
              <Star className={cn("size-3.5", starredOnly && "fill-accent")} />
              Starred
            </FilterToggle>
            <SortMenu options={SORTS} value={sort} onChange={setSort} className="ml-auto" />
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <FilterSummary
              shown={filtered.length}
              total={models.length}
              noun="models"
              active={filtersActive}
              onReset={() => {
                setQuery("");
                setProviders([]);
                setModalities([]);
                setOpenOnly(false);
                setStarredOnly(false);
              }}
            />
            <p className="text-[11.5px] text-ink-4">
              {compareIds.length}/{MAX_COMPARE} selected to compare
            </p>
          </div>

          {!ready ? (
            <Skeleton className="mt-3 h-[32rem] w-full rounded-xl" />
          ) : filtered.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<Cpu />}
              title="No models match those filters"
              description="Loosen a filter to see the rest of the catalogue."
            />
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface-1 shadow-xs">
              {filtered.map((model) => (
                <ModelRow
                  key={model.id}
                  model={model}
                  selected={compareIds.includes(model.id)}
                  selectionIndex={compareIds.indexOf(model.id)}
                  disabled={compareIds.length >= MAX_COMPARE}
                  onToggleSelect={() => toggleCompare(model.id)}
                  onOpen={() => setDetailId(model.id)}
                  onToggleFavorite={() => toggleFavorite(model.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-[4.5rem] max-h-[calc(100dvh-6rem)] overflow-y-auto pb-4 pr-1">
            <ComparisonPanel
              models={selectedModels}
              onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
              onClear={() => setCompareIds([])}
            />
          </div>
        </div>
      </div>

      {/* Mobile: comparison lives in a sheet rather than a squeezed column. */}
      <Dialog open={mobileCompareOpen} onOpenChange={setMobileCompareOpen}>
        <DialogContent size="lg" className="lg:hidden">
          <DialogHeader>
            <DialogTitle>Comparing {selectedModels.length} models</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <ComparisonPanel
              models={selectedModels}
              onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
              onClear={() => {
                setCompareIds([]);
                setMobileCompareOpen(false);
              }}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Floating selection bar on small screens. */}
      {selectedModels.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-3 lg:hidden">
          <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-line bg-overlay p-2 shadow-lg">
            <Badge tone="accent">{selectedModels.length} selected</Badge>
            <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink-3">
              {selectedModels.map((m) => m.name).join(", ")}
            </span>
            <Button size="sm" variant="primary" onClick={() => setMobileCompareOpen(true)}>
              Compare
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Clear selection"
              onClick={() => setCompareIds([])}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      <ModelDetail
        model={models.find((m) => m.id === detailId) ?? null}
        open={Boolean(detailId)}
        onOpenChange={(open) => !open && closeDetail()}
      />
    </PageContainer>
  );
}

export default function ModelsPage() {
  return (
    <Suspense fallback={null}>
      <ModelsPageInner />
    </Suspense>
  );
}
