"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Library,
  Plus,
  Target,
  Trash2,
  Workflow as WorkflowIcon,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ProviderMark } from "@/components/ui/provider-mark";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendChart } from "@/components/charts/trend-chart";
import { BreakdownBars } from "@/components/charts/bar-chart";
import { ProjectCode } from "@/features/projects/project-code";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_TONE,
} from "@/features/projects/project-meta";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { spendSeries, byProvider, total, withinRange } from "@/lib/analytics/spend";
import { PROVIDERS } from "@/lib/data/seed/providers";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { daysBetween, formatDate, parseDay, relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { ProjectStatus } from "@/lib/data/types";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { workspace, ready } = useWorkspace();
  const updateProject = useWorkspaceStore((s) => s.updateProject);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const toggleTask = useWorkspaceStore((s) => s.toggleTask);
  const addTask = useWorkspaceStore((s) => s.addTask);
  const removeTask = useWorkspaceStore((s) => s.removeTask);
  const toast = useUiStore((s) => s.toast);

  const [taskDraft, setTaskDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const project = workspace?.projects.find((p) => p.id === id) ?? null;
  usePageTitle(project?.name ?? null);

  const data = useMemo(() => {
    if (!workspace || !project) return null;
    const entries = workspace.spend.filter((e) => e.projectId === project.id);
    const last30 = withinRange(entries, "30d", now);
    return {
      series: spendSeries(entries, "3m", now),
      spent30: total(last30),
      spentAll: total(entries),
      byProvider: byProvider(
        last30,
        (p) => PROVIDERS[p].name,
        (p) => PROVIDERS[p].series,
      ),
      tokens: last30.reduce((sum, e) => sum + (e.tokensIn ?? 0) + (e.tokensOut ?? 0), 0),
      tools: workspace.tools.filter((t) => project.toolIds.includes(t.id)),
      models: workspace.models.filter((m) => project.modelIds.includes(m.id)),
      prompts: workspace.prompts.filter((p) => project.promptIds.includes(p.id)),
      workflows: workspace.workflows.filter((w) => w.projectId === project.id),
    };
  }, [workspace, project, now]);

  if (!ready) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (!project || !data) {
    return (
      <PageContainer width="narrow" className="pt-12">
        <EmptyState
          icon={<Target />}
          title="Project not found"
          description="It may have been deleted from this workspace."
          action={
            <Button variant="primary" size="sm" asChild>
              <Link href="/projects">All projects</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const done = project.tasks.filter((t) => t.done).length;
  const overBudget = project.budget !== null && data.spent30 > project.budget;
  const notes = notesDraft ?? project.notes;

  return (
    <PageContainer>
      <Button variant="ghost" size="sm" className="-ml-2 mb-3" asChild>
        <Link href="/projects">
          <ArrowLeft className="size-3.5" />
          All projects
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectCode project={project} size="md" />
            <Badge tone={PROJECT_STATUS_TONE[project.status]} dot>
              {PROJECT_STATUS_LABEL[project.status]}
            </Badge>
            {project.tags.map((tag) => (
              <Badge key={tag} tone="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="mt-2.5 text-[21px] font-semibold tracking-[-0.02em] text-ink">
            {project.name}
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-3">
            {project.description}
          </p>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-4">
            <span>Created {formatDate(project.createdAt)}</span>
            <span>Updated {relativeTime(project.updatedAt, now)}</span>
            {project.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  daysBetween(now, parseDay(project.dueDate)) < 7 && "text-warning",
                )}
              >
                <CalendarDays className="size-3" />
                Due {formatDate(project.dueDate)}
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Select
            aria-label="Project status"
            value={project.status}
            className="w-32"
            onChange={(event) => {
              updateProject(project.id, { status: event.target.value as ProjectStatus });
              toast({ title: "Status updated", tone: "success" });
            }}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABEL[status]}
              </option>
            ))}
          </Select>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete project"
            className="text-negative hover:bg-negative-soft"
            onClick={() => {
              deleteProject(project.id);
              toast({ title: `${project.name} deleted`, tone: "warning" });
              router.push("/projects");
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface-1 p-3.5 shadow-xs">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">
            Spend, 30 days
          </p>
          <p
            className={cn(
              "mt-1.5 font-mono text-[24px] font-semibold tabular-nums tracking-[-0.02em]",
              overBudget ? "text-negative" : "text-ink",
            )}
          >
            {formatCurrency(data.spent30)}
          </p>
          {project.budget !== null && (
            <>
              <Progress
                className="mt-2"
                value={data.spent30}
                max={project.budget}
                tone={overBudget ? "negative" : data.spent30 / project.budget > 0.8 ? "warning" : "accent"}
                size="sm"
              />
              <p className="mt-1.5 text-[11px] text-ink-4">
                of {formatCurrency(project.budget)} monthly budget
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface-1 p-3.5 shadow-xs">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">
            Lifetime spend
          </p>
          <p className="mt-1.5 font-mono text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-ink">
            {formatCurrency(data.spentAll, { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-2 text-[11px] text-ink-4">
            {formatNumber(data.tokens / 1_000_000, 1)}M tokens in the last 30 days
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface-1 p-3.5 shadow-xs">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">Tasks</p>
          <p className="mt-1.5 font-mono text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-ink">
            {done}
            <span className="text-[15px] font-normal text-ink-4">/{project.tasks.length}</span>
          </p>
          <Progress
            className="mt-2"
            value={done}
            max={Math.max(1, project.tasks.length)}
            tone={done === project.tasks.length ? "positive" : "accent"}
            size="sm"
          />
          <p className="mt-1.5 text-[11px] text-ink-4">
            {project.tasks.length - done} open
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface-1 p-3.5 shadow-xs">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">Stack</p>
          <p className="mt-1.5 font-mono text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-ink">
            {data.tools.length + data.models.length}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {[...new Set([...data.tools.map((t) => t.provider), ...data.models.map((m) => m.provider)])]
              .slice(0, 6)
              .map((provider) => (
                <ProviderMark key={provider} provider={provider} size="xs" />
              ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Objectives */}
          <Card>
            <CardHeader>
              <CardTitle>Objectives</CardTitle>
            </CardHeader>
            {project.objectives.length === 0 ? (
              <p className="px-4 py-5 text-[12.5px] text-ink-4">No objectives set yet.</p>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {project.objectives.map((objective, index) => (
                  <li key={objective} className="flex items-start gap-2.5 px-4 py-2.5">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-line font-mono text-[9px] tabular-nums text-ink-4">
                      {index + 1}
                    </span>
                    <span className="text-[12.5px] leading-relaxed text-ink-2">{objective}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Tasks</CardTitle>
                <p className="mt-0.5 text-xs text-ink-3">
                  {done} of {project.tasks.length} complete
                </p>
              </div>
            </CardHeader>
            <ul className="divide-y divide-line-subtle">
              {project.tasks.map((task) => {
                const overdue =
                  !task.done && task.dueDate && daysBetween(now, parseDay(task.dueDate)) < 0;
                const dueSoon =
                  !task.done &&
                  task.dueDate &&
                  daysBetween(now, parseDay(task.dueDate)) >= 0 &&
                  daysBetween(now, parseDay(task.dueDate)) <= 5;
                return (
                  <li key={task.id} className="group flex items-center gap-2.5 px-4 py-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.done}
                      aria-label={task.title}
                      onClick={() => toggleTask(project.id, task.id)}
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-all duration-150",
                        task.done
                          ? "border-positive bg-positive text-white"
                          : "border-line-strong hover:border-accent",
                      )}
                    >
                      {task.done && <Check className="size-3" strokeWidth={3.5} />}
                    </button>
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[12.5px] leading-snug transition-colors",
                        task.done ? "text-ink-4 line-through" : "text-ink-2",
                      )}
                    >
                      {task.title}
                    </span>
                    {task.dueDate && !task.done && (
                      <span
                        className={cn(
                          "shrink-0 font-mono text-[10.5px] tabular-nums",
                          overdue ? "text-negative" : dueSoon ? "text-warning" : "text-ink-4",
                        )}
                      >
                        {formatDate(task.dueDate, "short")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTask(project.id, task.id)}
                      aria-label={`Remove task ${task.title}`}
                      className="grid size-5 shrink-0 place-items-center rounded text-ink-4 opacity-0 transition-opacity hover:text-negative focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-2 border-t border-line-subtle p-3">
              <Input
                value={taskDraft}
                placeholder="Add a task…"
                aria-label="New task"
                onChange={(event) => setTaskDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && taskDraft.trim()) {
                    addTask(project.id, taskDraft.trim());
                    setTaskDraft("");
                  }
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={!taskDraft.trim()}
                onClick={() => {
                  addTask(project.id, taskDraft.trim());
                  setTaskDraft("");
                }}
              >
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>
          </Card>

          {/* Spend */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Spend, last 3 months</CardTitle>
                <p className="mt-0.5 text-xs text-ink-3">Attributed to this project only</p>
              </div>
            </CardHeader>
            <div className="p-4 pt-3">
              <TrendChart
                height={180}
                ariaLabel={`Spend for ${project.name}`}
                data={data.series.map((point) => ({
                  label: point.label,
                  values: { spend: point.value },
                }))}
                series={[
                  { key: "spend", label: "Spend", color: `var(--series-${project.series})` },
                ]}
                showLegend={false}
              />
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              {notesDraft !== null && notesDraft !== project.notes && (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    updateProject(project.id, { notes: notesDraft });
                    setNotesDraft(null);
                    toast({ title: "Notes saved", tone: "success" });
                  }}
                >
                  Save
                </Button>
              )}
            </CardHeader>
            <div className="p-4">
              <Textarea
                value={notes}
                rows={5}
                aria-label="Project notes"
                placeholder="What have you learned? What would you tell someone picking this up?"
                onChange={(event) => setNotesDraft(event.target.value)}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Providers */}
          {data.byProvider.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Where the money went</CardTitle>
              </CardHeader>
              <div className="p-4">
                <BreakdownBars
                  data={data.byProvider.map((row) => ({
                    key: row.key,
                    label: row.label,
                    value: row.value,
                    color: `var(--series-${row.series})`,
                  }))}
                />
              </div>
            </Card>
          )}

          {/* Stack */}
          <Card>
            <CardHeader>
              <CardTitle>Tools & models</CardTitle>
            </CardHeader>
            <ul className="divide-y divide-line-subtle">
              {data.tools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/tools?tool=${tool.id}`}
                    className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-surface-2/60"
                  >
                    <ProviderMark provider={tool.provider} size="sm" fallbackName={tool.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] text-ink-2">{tool.name}</span>
                      <span className="block truncate text-[10.5px] capitalize text-ink-4">
                        {tool.category}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-4">
                      {tool.billingCycle === "usage"
                        ? "usage"
                        : formatCurrency(tool.monthlyCost, { maximumFractionDigits: 0 })}
                    </span>
                  </Link>
                </li>
              ))}
              {data.models.map((model) => (
                <li key={model.id}>
                  <Link
                    href={`/models?model=${model.id}`}
                    className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-surface-2/60"
                  >
                    <ProviderMark provider={model.provider} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] text-ink-2">{model.name}</span>
                      <span className="block truncate text-[10.5px] text-ink-4">model</span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-4">
                      ${model.inputPrice}/${model.outputPrice}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* Prompts */}
          <Card>
            <CardHeader>
              <CardTitle>Prompts</CardTitle>
              <Button variant="ghost" size="xs" asChild>
                <Link href="/prompts">
                  <Library className="size-3" />
                  Vault
                </Link>
              </Button>
            </CardHeader>
            {data.prompts.length === 0 ? (
              <p className="px-4 py-4 text-[12px] text-ink-4">No prompts linked yet.</p>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {data.prompts.map((prompt) => (
                  <li key={prompt.id}>
                    <Link
                      href={`/prompts?prompt=${prompt.id}`}
                      className="block px-4 py-2 transition-colors hover:bg-surface-2/60"
                    >
                      <span className="block truncate text-[12.5px] text-ink-2">{prompt.title}</span>
                      <span className="mt-0.5 block truncate text-[10.5px] text-ink-4">
                        {formatNumber(prompt.useCount)} runs · {prompt.variables.length} variables
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Workflows */}
          {data.workflows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Workflows</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-line-subtle">
                {data.workflows.map((workflow) => (
                  <li key={workflow.id}>
                    <Link
                      href={`/workflows?workflow=${workflow.id}`}
                      className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-surface-2/60"
                    >
                      <WorkflowIcon className="size-3.5 shrink-0 text-ink-4" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] text-ink-2">
                          {workflow.name}
                        </span>
                        <span className="block truncate text-[10.5px] text-ink-4">
                          {workflow.nodes.length} steps · {formatNumber(workflow.runCount)} runs
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
