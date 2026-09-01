"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { FilterMenu, FilterSummary, SortMenu } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/features/projects/project-card";
import { ProjectForm } from "@/features/projects/project-form";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_ORDER,
} from "@/features/projects/project-meta";
import { useWorkspace } from "@/hooks/use-workspace";
import { fuzzyMatch } from "@/lib/search/fuzzy";
import { matchesQuery } from "@/lib/search";
import { addDays, toDayKey } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/format";
import type { Project, ProviderId } from "@/lib/data/types";

type SortKey = "updated" | "spend" | "due" | "progress" | "name";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "updated", label: "Recently updated" },
  { value: "spend", label: "Spend" },
  { value: "due", label: "Due date" },
  { value: "progress", label: "Progress" },
  { value: "name", label: "Name" },
];

function ProjectsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { workspace, ready } = useWorkspace();

  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("updated");
  const [formOpen, setFormOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const projects = useMemo(() => workspace?.projects ?? [], [workspace]);

  useEffect(() => {
    if (params.get("new")) {
      setFormOpen(true);
      router.replace("/projects");
    }
  }, [params, router]);

  // 30-day spend per project, computed once for the whole page.
  const spendByProject = useMemo(() => {
    const from = toDayKey(addDays(now, -29));
    const to = toDayKey(now);
    const totals = new Map<string, number>();
    for (const entry of workspace?.spend ?? []) {
      if (!entry.projectId || entry.date < from || entry.date > to) continue;
      totals.set(entry.projectId, (totals.get(entry.projectId) ?? 0) + entry.amount);
    }
    return totals;
  }, [workspace, now]);

  const providersByProject = useMemo(() => {
    const toolById = new Map((workspace?.tools ?? []).map((t) => [t.id, t]));
    const modelById = new Map((workspace?.models ?? []).map((m) => [m.id, m]));
    const out = new Map<string, ProviderId[]>();
    for (const project of projects) {
      const set = new Set<ProviderId>();
      for (const id of project.toolIds) {
        const provider = toolById.get(id)?.provider;
        if (provider) set.add(provider);
      }
      for (const id of project.modelIds) {
        const provider = modelById.get(id)?.provider;
        if (provider) set.add(provider);
      }
      out.set(project.id, [...set]);
    }
    return out;
  }, [projects, workspace]);

  const filtered = useMemo(() => {
    const list = projects.filter(
      (project) => !statuses.length || statuses.includes(project.status),
    );

    if (query.trim()) {
      return list
        .filter((project) =>
          matchesQuery(
            query,
            project.name,
            project.code,
            project.description,
            project.tags.join(" "),
          ),
        )
        .map((project) => ({ project, score: fuzzyMatch(query, project.name)?.score ?? 0 }))
        .sort((a, b) => b.score - a.score || a.project.name.localeCompare(b.project.name))
        .map((row) => row.project);
    }

    return [...list].sort((a, b) => {
      switch (sort) {
        case "spend":
          return (spendByProject.get(b.id) ?? 0) - (spendByProject.get(a.id) ?? 0);
        case "due":
          return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
        case "progress": {
          const p = (project: Project) =>
            project.tasks.length
              ? project.tasks.filter((t) => t.done).length / project.tasks.length
              : 0;
          return p(b) - p(a);
        }
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
  }, [projects, statuses, query, sort, spendByProject]);

  // Grouped by status when unsorted and unfiltered — reads as a board.
  const grouped = useMemo(() => {
    if (query || sort !== "updated") return null;
    return PROJECT_STATUS_ORDER.map((status) => ({
      status,
      projects: filtered.filter((p) => p.status === status),
    })).filter((group) => group.projects.length > 0);
  }, [filtered, query, sort]);

  const totals = useMemo(() => {
    const active = projects.filter((p) => p.status === "active");
    return {
      active: active.length,
      tracked: [...spendByProject.values()].reduce((sum, v) => sum + v, 0),
      budgeted: projects.reduce((sum, p) => sum + (p.budget ?? 0), 0),
    };
  }, [projects, spendByProject]);

  const renderGrid = (list: Project[]) => (
    <div className="stack-in grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          now={now}
          spent={spendByProject.get(project.id) ?? 0}
          providers={providersByProject.get(project.id) ?? []}
        />
      ))}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="What the tools are actually for. Each project carries its own objectives, tasks, stack and spend."
        meta={
          ready ? (
            <>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {totals.active}
                </span>{" "}
                active of {projects.length}
              </span>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatCurrency(totals.tracked, { maximumFractionDigits: 0 })}
                </span>{" "}
                attributed in 30 days
              </span>
              <span className="text-[12.5px] text-ink-3">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatCurrency(totals.budgeted, { maximumFractionDigits: 0 })}
                </span>{" "}
                budgeted per month
              </span>
            </>
          ) : (
            <Skeleton className="h-4 w-64" />
          )
        }
        actions={
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-3.5" strokeWidth={2.4} />
            New project
          </Button>
        }
      />

      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:overflow-visible sm:pb-0">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search projects…"
          resultCount={filtered.length}
          className="w-56 min-w-48 shrink-0 sm:basis-64"
        />
        <FilterMenu
          label="Status"
          selected={statuses}
          onChange={setStatuses}
          options={PROJECT_STATUSES.map((s) => ({
            value: s,
            label: PROJECT_STATUS_LABEL[s],
            count: projects.filter((p) => p.status === s).length,
          }))}
        />
        <SortMenu options={SORTS} value={sort} onChange={setSort} className="ml-auto" />
      </div>

      <div className="mt-2.5">
        <FilterSummary
          shown={filtered.length}
          total={projects.length}
          noun="projects"
          active={Boolean(statuses.length || query)}
          onReset={() => {
            setQuery("");
            setStatuses([]);
          }}
        />
      </div>

      {!ready ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-3"
          icon={<FolderKanban />}
          title="No projects here"
          description="Projects give spend somewhere to land and keep a stack together. Start with the piece of work taking most of your time."
          action={
            <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New project
            </Button>
          }
        />
      ) : grouped ? (
        <div className="mt-4 space-y-6">
          {grouped.map((group) => (
            <section key={group.status}>
              <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">
                {PROJECT_STATUS_LABEL[group.status]}
                <span className="font-mono tabular-nums">{group.projects.length}</span>
                <span className="h-px flex-1 bg-line-subtle" />
              </h2>
              {renderGrid(group.projects)}
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-3">{renderGrid(filtered)}</div>
      )}

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={(id) => router.push(`/projects/${id}`)}
      />
    </PageContainer>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsPageInner />
    </Suspense>
  );
}
