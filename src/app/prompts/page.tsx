"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Library,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchField } from "@/components/ui/search-field";
import { FilterMenu, FilterSummary, FilterToggle, SortMenu } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { PromptComposer } from "@/features/prompts/prompt-composer";
import { PromptEditor } from "@/features/prompts/prompt-editor";
import { PromptHistory } from "@/features/prompts/prompt-history";
import {
  PROMPT_CATEGORIES,
  PROMPT_CATEGORY_LABEL,
  PROMPT_CATEGORY_SERIES,
} from "@/features/prompts/prompt-meta";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { fuzzyMatch } from "@/lib/search/fuzzy";
import { formatNumber } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Prompt } from "@/lib/data/types";

type SortKey = "recent" | "used" | "created" | "title";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Recently used" },
  { value: "used", label: "Most used" },
  { value: "created", label: "Newest" },
  { value: "title", label: "Title" },
];

const NEW_PROMPT_BODY = `You are helping with {{task}}.

Context:
{{context}}

Requirements:
- 
- 

Return only the result, with no preamble.`;

function PromptsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { workspace, ready } = useWorkspace();
  const createPrompt = useWorkspaceStore((s) => s.createPrompt);
  const duplicatePrompt = useWorkspaceStore((s) => s.duplicatePrompt);
  const deletePrompt = useWorkspaceStore((s) => s.deletePrompt);
  const toggleFavorite = useWorkspaceStore((s) => s.togglePromptFavorite);
  const toast = useUiStore((s) => s.toast);

  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [starredOnly, setStarredOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("compose");

  const prompts = useMemo(() => workspace?.prompts ?? [], [workspace]);
  const now = useMemo(() => new Date(), []);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const prompt of prompts) {
      for (const tag of prompt.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [prompts]);

  const filtered = useMemo(() => {
    const list = prompts.filter((prompt) => {
      if (categories.length && !categories.includes(prompt.category)) return false;
      if (tagFilter.length && !tagFilter.some((tag) => prompt.tags.includes(tag))) return false;
      if (starredOnly && !prompt.favorite) return false;
      return true;
    });

    if (query.trim()) {
      return list
        .map((prompt) => {
          const match =
            fuzzyMatch(query, prompt.title) ??
            fuzzyMatch(query, `${prompt.description} ${prompt.tags.join(" ")}`) ??
            fuzzyMatch(query, prompt.body);
          return match ? { prompt, score: match.score } : null;
        })
        .filter((row): row is { prompt: Prompt; score: number } => row !== null)
        .sort((a, b) => b.score - a.score)
        .map((row) => row.prompt);
    }

    return [...list].sort((a, b) => {
      switch (sort) {
        case "used":
          return b.useCount - a.useCount;
        case "created":
          return b.createdAt.localeCompare(a.createdAt);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return (b.lastUsedAt ?? b.updatedAt).localeCompare(a.lastUsedAt ?? a.updatedAt);
      }
    });
  }, [prompts, categories, tagFilter, starredOnly, query, sort]);

  // Keep a valid selection as the list changes underneath.
  useEffect(() => {
    const param = params.get("prompt");
    if (param && prompts.some((p) => p.id === param)) {
      setSelectedId(param);
      return;
    }
    if (params.get("new") && prompts.length > 0) {
      const id = createPrompt({
        title: "New prompt",
        description: "",
        body: NEW_PROMPT_BODY,
        category: "writing",
      });
      setSelectedId(id);
      setTab("edit");
      router.replace("/prompts");
      return;
    }
    setSelectedId((current) => {
      if (current && prompts.some((p) => p.id === current)) return current;
      return filtered[0]?.id ?? null;
    });
    // filtered is intentionally excluded — it changes on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, prompts]);

  const selected = prompts.find((p) => p.id === selectedId) ?? null;

  const select = useCallback((id: string) => {
    setSelectedId(id);
    setTab("compose");
  }, []);

  const onNew = () => {
    const id = createPrompt({
      title: "New prompt",
      description: "",
      body: NEW_PROMPT_BODY,
      category: "writing",
    });
    setSelectedId(id);
    setTab("edit");
    toast({ title: "Prompt created", description: "Give it a title and a body", tone: "success" });
  };

  const filtersActive = Boolean(categories.length || tagFilter.length || starredOnly || query);
  const totalRuns = prompts.reduce((sum, p) => sum + p.useCount, 0);

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Prompt Vault"
        description="Reusable prompts with typed variables, a fill-in panel and version history."
        meta={
          ready ? (
            <>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {prompts.length}
                </span>{" "}
                prompts
              </span>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatNumber(totalRuns)}
                </span>{" "}
                total runs
              </span>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {prompts.filter((p) => p.variables.length > 0).length}
                </span>{" "}
                take variables
              </span>
            </>
          ) : (
            <Skeleton className="h-4 w-56" />
          )
        }
        actions={
          <Button variant="primary" size="sm" onClick={onNew}>
            <Plus className="size-3.5" strokeWidth={2.4} />
            New prompt
          </Button>
        }
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        {/* List */}
        <div className={cn("min-w-0", selected && "hidden lg:block")}>
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search prompts and bodies…"
              resultCount={filtered.length}
              className="basis-full"
            />
            <FilterMenu
              label="Category"
              selected={categories}
              onChange={setCategories}
              options={PROMPT_CATEGORIES.map((c) => ({
                value: c,
                label: PROMPT_CATEGORY_LABEL[c],
                count: prompts.filter((p) => p.category === c).length,
              })).filter((o) => (o.count ?? 0) > 0)}
            />
            <FilterMenu
              label="Tag"
              selected={tagFilter}
              onChange={setTagFilter}
              options={allTags.map(([tag, count]) => ({ value: tag, label: tag, count }))}
            />
            <FilterToggle
              active={starredOnly}
              onClick={() => setStarredOnly((v) => !v)}
              label={starredOnly ? "Show all prompts" : "Show starred prompts only"}
            >
              <Star className={cn("size-3.5", starredOnly && "fill-accent")} />
            </FilterToggle>
            <SortMenu options={SORTS} value={sort} onChange={setSort} className="ml-auto" />
          </div>

          <div className="mt-2.5">
            <FilterSummary
              shown={filtered.length}
              total={prompts.length}
              noun="prompts"
              active={filtersActive}
              onReset={() => {
                setQuery("");
                setCategories([]);
                setTagFilter([]);
                setStarredOnly(false);
              }}
            />
          </div>

          {!ready ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<Library />}
              title="No prompts match"
              description="Clear the filters, or start a new prompt from scratch."
              action={
                <Button variant="primary" size="sm" onClick={onNew}>
                  <Plus className="size-3.5" />
                  New prompt
                </Button>
              }
            />
          ) : (
            <ul className="mt-3 space-y-1.5">
              {filtered.map((prompt) => {
                const active = prompt.id === selectedId;
                const color = `var(--series-${PROMPT_CATEGORY_SERIES[prompt.category]})`;
                return (
                  <li key={prompt.id}>
                    <button
                      type="button"
                      onClick={() => select(prompt.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "group relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left",
                        "transition-[border-color,background-color] duration-150",
                        active
                          ? "border-line-strong bg-surface-2"
                          : "border-line bg-surface-1 hover:border-line-strong hover:bg-surface-2/60",
                      )}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-0.5"
                        style={{ backgroundColor: active ? color : "transparent" }}
                      />
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[12.5px] font-medium text-ink">
                              {prompt.title}
                            </span>
                            {prompt.favorite && (
                              <Star className="size-3 shrink-0 fill-accent text-accent" />
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-ink-4">
                            {prompt.description || "No description"}
                          </span>
                        </span>
                      </span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <span
                          className="rounded-[3px] px-1 py-px text-[9.5px] font-medium capitalize"
                          style={{
                            color,
                            backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)`,
                          }}
                        >
                          {PROMPT_CATEGORY_LABEL[prompt.category]}
                        </span>
                        {prompt.variables.length > 0 && (
                          <span className="font-mono text-[10px] tabular-nums text-ink-4">
                            {prompt.variables.length} vars
                          </span>
                        )}
                        <span className="ml-auto font-mono text-[10px] tabular-nums text-ink-4">
                          {formatNumber(prompt.useCount)}× · {relativeTime(prompt.lastUsedAt, now)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className={cn("min-w-0 lg:sticky lg:top-[4.5rem] lg:self-start", !selected && "hidden lg:block")}>
          {!ready ? (
            <Skeleton className="h-[36rem] w-full rounded-xl" />
          ) : !selected ? (
            <EmptyState
              icon={<Library />}
              title="Select a prompt"
              description="Pick one from the list to fill in its variables and copy the result."
            />
          ) : (
            <div className="rounded-xl border border-line bg-surface-1 shadow-xs">
              <header className="flex items-start gap-3 border-b border-line-subtle p-4">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden"
                  aria-label="Back to list"
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft className="size-4" />
                </Button>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
                    {selected.title}
                  </h2>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-3">
                    {selected.description || "No description yet."}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone="outline">{PROMPT_CATEGORY_LABEL[selected.category]}</Badge>
                    {selected.tags.map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag}
                      </Badge>
                    ))}
                    <span className="ml-1 font-mono text-[10.5px] tabular-nums text-ink-4">
                      updated {relativeTime(selected.updatedAt, now)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={selected.favorite ? "Unstar prompt" : "Star prompt"}
                    aria-pressed={selected.favorite}
                    onClick={() => toggleFavorite(selected.id)}
                  >
                    <Star
                      className={cn("size-3.5", selected.favorite && "fill-accent text-accent")}
                    />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onSelect={() => {
                          const id = duplicatePrompt(selected.id);
                          if (id) {
                            setSelectedId(id);
                            setTab("edit");
                            toast({ title: "Prompt duplicated", tone: "success" });
                          }
                        }}
                      >
                        <Copy />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        danger
                        onSelect={() => {
                          const snapshot = selected;
                          deletePrompt(selected.id);
                          setSelectedId(null);
                          toast({
                            title: `“${snapshot.title}” deleted`,
                            tone: "warning",
                            action: {
                              label: "Undo",
                              run: () => {
                                const id = createPrompt(snapshot);
                                setSelectedId(id);
                              },
                            },
                          });
                        }}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="px-4">
                  <TabsTrigger value="compose">Compose</TabsTrigger>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="history">
                    History
                    {selected.versions.length > 0 && (
                      <span className="ml-1.5 font-mono text-[10px] tabular-nums text-ink-4">
                        {selected.versions.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="compose" className="p-4">
                  <PromptComposer prompt={selected} />
                </TabsContent>
                <TabsContent value="edit" className="p-4">
                  <PromptEditor prompt={selected} />
                </TabsContent>
                <TabsContent value="history" className="p-4">
                  <PromptHistory prompt={selected} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default function PromptsPage() {
  return (
    <Suspense fallback={null}>
      <PromptsPageInner />
    </Suspense>
  );
}
