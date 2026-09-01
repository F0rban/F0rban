"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Play, RotateCcw, Square, Workflow as WorkflowIcon } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkflowCanvas, KIND_LABEL } from "@/features/workflows/workflow-canvas";
import {
  criticalPathMs,
  nodeCost,
  useWorkflowRun,
  workflowCost,
} from "@/features/workflows/use-workflow-run";
import { ProjectCode } from "@/features/projects/project-code";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { formatCompact, formatCurrency, formatDuration, formatNumber } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { WorkflowStatus } from "@/lib/data/types";

const STATUS_TONE: Record<WorkflowStatus, "positive" | "info" | "neutral"> = {
  ready: "positive",
  scheduled: "info",
  draft: "neutral",
};

function WorkflowsPageInner() {
  const params = useSearchParams();
  const { workspace, ready } = useWorkspace();
  const recordRun = useWorkspaceStore((s) => s.recordWorkflowRun);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const workflows = useMemo(() => workspace?.workflows ?? [], [workspace]);
  const models = useMemo(
    () => new Map((workspace?.models ?? []).map((m) => [m.id, m])),
    [workspace],
  );
  const tools = useMemo(() => new Map((workspace?.tools ?? []).map((t) => [t.id, t])), [workspace]);

  useEffect(() => {
    const param = params.get("workflow");
    setSelectedId((current) => {
      if (param && workflows.some((w) => w.id === param)) return param;
      if (current && workflows.some((w) => w.id === current)) return current;
      return workflows[0]?.id ?? null;
    });
  }, [params, workflows]);

  const workflow = workflows.find((w) => w.id === selectedId) ?? null;
  const emptyWorkflow = useMemo(
    () => ({
      id: "__none",
      name: "",
      description: "",
      status: "draft" as WorkflowStatus,
      nodes: [],
      edges: [],
      projectId: null,
      tags: [],
      runCount: 0,
      lastRunAt: null,
      createdAt: new Date().toISOString(),
      lastRunCost: 0,
    }),
    [],
  );

  const run = useWorkflowRun(workflow ?? emptyWorkflow, models);

  // Persist the simulated run once it finishes, so the timeline reflects it.
  const [recorded, setRecorded] = useState<string | null>(null);
  useEffect(() => {
    if (run.status !== "complete" || !workflow) return;
    const key = `${workflow.id}-${run.stats.cost.toFixed(6)}`;
    if (recorded === key) return;
    setRecorded(key);
    recordRun(workflow.id, Number(run.stats.cost.toFixed(6)));
  }, [run.status, run.stats.cost, workflow, recorded, recordRun]);

  const project = workflow?.projectId
    ? workspace?.projects.find((p) => p.id === workflow.projectId)
    : null;

  const estimate = useMemo(
    () =>
      workflow
        ? {
            cost: workflowCost(workflow, models),
            wallClock: criticalPathMs(workflow),
            tokens: workflow.nodes.reduce((sum, n) => sum + n.tokensIn + n.tokensOut, 0),
          }
        : null,
    [workflow, models],
  );

  const selectedNode = workflow?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Workflows"
        description="Multi-step pipelines you can step through. Costs come from live model prices, so the estimate is real even though the run is a simulation."
      />

      {!ready ? (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : !workflow ? (
        <EmptyState
          className="mt-5"
          icon={<WorkflowIcon />}
          title="No workflows yet"
          description="A workflow records the steps a piece of work actually goes through, and what each one costs."
        />
      ) : (
        <>
          {/* Workflow selector */}
          <div className="mask-fade-r mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {workflows.map((item) => {
              const active = item.id === workflow.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setSelectedNodeId(null);
                  }}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "shrink-0 rounded-lg border px-3 py-2 text-left transition-colors duration-150",
                    active
                      ? "border-line-strong bg-surface-2"
                      : "border-line bg-surface-1 hover:border-line-strong hover:bg-surface-2/60",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("text-[12.5px] font-medium", active ? "text-ink" : "text-ink-2")}>
                      {item.name}
                    </span>
                    <Badge tone={STATUS_TONE[item.status]} dot>
                      {item.status}
                    </Badge>
                  </span>
                  <span className="mt-0.5 block font-mono text-[10.5px] tabular-nums text-ink-4">
                    {item.nodes.length} steps · {formatNumber(item.runCount)} runs
                  </span>
                </button>
              );
            })}
          </div>

          {/* Header + controls */}
          <Card className="mt-3">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                    {workflow.name}
                  </h2>
                  {project && (
                    <Link href={`/projects/${project.id}`} className="inline-flex">
                      <ProjectCode project={project} />
                    </Link>
                  )}
                  {workflow.tags.map((tag) => (
                    <Badge key={tag} tone="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink-3">
                  {workflow.description}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] tabular-nums text-ink-4">
                  <span>{formatNumber(workflow.runCount)} runs</span>
                  <span>last {relativeTime(workflow.lastRunAt, now)}</span>
                  <span>{formatCurrency(workflow.lastRunCost, { maximumFractionDigits: 4 })}/run</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {run.status === "running" ? (
                  <Button variant="secondary" size="sm" onClick={run.stop}>
                    <Square className="size-3.5" />
                    Stop
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={run.start}>
                    <Play className="size-3.5" />
                    {run.status === "complete" ? "Run again" : "Simulate run"}
                  </Button>
                )}
                {run.status !== "idle" && (
                  <Button variant="ghost" size="icon" aria-label="Reset run" onClick={run.reset}>
                    <RotateCcw className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Live run readout */}
            <div className="border-t border-line-subtle px-4 py-3">
              <Progress
                value={run.progress * 100}
                tone={run.status === "complete" ? "positive" : "accent"}
                label="Simulated run progress"
              />
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Cost",
                    live: formatCurrency(run.stats.cost, { maximumFractionDigits: 4 }),
                    estimate: estimate ? formatCurrency(estimate.cost, { maximumFractionDigits: 4 }) : "—",
                  },
                  {
                    label: "Tokens",
                    live: formatCompact(run.stats.tokensIn + run.stats.tokensOut),
                    estimate: estimate ? formatCompact(estimate.tokens) : "—",
                  },
                  {
                    label: "Compute time",
                    live: formatDuration(run.stats.elapsedMs),
                    estimate: estimate ? formatDuration(estimate.wallClock) : "—",
                  },
                  {
                    label: "Steps",
                    live: `${Math.round(run.progress * workflow.nodes.length)}`,
                    estimate: `${workflow.nodes.length}`,
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink-4">
                      {row.label}
                    </dt>
                    <dd className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-ink">
                      {row.live}
                      <span className="ml-1 text-[10.5px] font-normal text-ink-4">
                        / {row.estimate}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[11px] text-ink-4">
                {run.status === "running"
                  ? "Replaying recorded timings at a watchable speed. No requests are made."
                  : run.status === "complete"
                    ? "Run complete — the result was written to your activity timeline."
                    : "Cost counts model tokens at current list prices; steps that run on a subscription tool cost nothing extra. Compute time is the critical path through the graph, not the sum of every step."}
              </p>
            </div>
          </Card>

          {/* Canvas */}
          <div className="mt-4">
            <WorkflowCanvas
              workflow={workflow}
              models={models}
              tools={tools}
              nodeStates={run.nodeStates}
              activeNodeId={run.activeNodeId}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId((prev) => (prev === id ? null : id))}
              running={run.status === "running"}
            />
          </div>

          {/* Step detail */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedNode ? selectedNode.title : "Step detail"}
                </CardTitle>
                {selectedNode && (
                  <Badge tone="outline">{KIND_LABEL[selectedNode.kind]}</Badge>
                )}
              </CardHeader>
              <div className="p-4">
                {!selectedNode ? (
                  <p className="text-[12.5px] text-ink-4">
                    Select a step on the canvas to see what it does, what it costs, and why it is
                    there.
                  </p>
                ) : (
                  <>
                    <p className="text-[13px] leading-relaxed text-ink-2">
                      {selectedNode.note || "No note on this step yet."}
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        ["Duration", formatDuration(selectedNode.durationMs)],
                        [
                          "Tokens in",
                          selectedNode.tokensIn ? formatCompact(selectedNode.tokensIn) : "—",
                        ],
                        [
                          "Tokens out",
                          selectedNode.tokensOut ? formatCompact(selectedNode.tokensOut) : "—",
                        ],
                        [
                          "Cost",
                          nodeCost(selectedNode, models) > 0
                            ? formatCurrency(nodeCost(selectedNode, models), {
                                maximumFractionDigits: 4,
                              })
                            : "—",
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-lg border border-line-subtle bg-surface-2/40 p-2.5"
                        >
                          <dt className="text-[9.5px] font-medium uppercase tracking-[0.07em] text-ink-4">
                            {label}
                          </dt>
                          <dd className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums text-ink">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {(selectedNode.modelId || selectedNode.toolId) && (
                      <p className="mt-3 text-[11.5px] text-ink-4">
                        Runs on{" "}
                        {selectedNode.modelId ? (
                          <Link
                            href={`/models?model=${selectedNode.modelId}`}
                            className="text-accent hover:underline"
                          >
                            {models.get(selectedNode.modelId)?.name}
                          </Link>
                        ) : (
                          <Link
                            href={`/tools?tool=${selectedNode.toolId}`}
                            className="text-accent hover:underline"
                          >
                            {tools.get(selectedNode.toolId!)?.name}
                          </Link>
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost by step</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-line-subtle">
                {[...workflow.nodes]
                  .map((node) => ({ node, cost: nodeCost(node, models) }))
                  .sort((a, b) => b.cost - a.cost)
                  .slice(0, 6)
                  .map(({ node, cost }) => (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-surface-2/60"
                      >
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">
                          {node.title}
                        </span>
                        <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-ink">
                          {cost > 0 ? formatCurrency(cost, { maximumFractionDigits: 4 }) : "—"}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
              {estimate && estimate.cost > 0 && (
                <div className="border-t border-line-subtle px-4 py-2.5">
                  <p className="text-[11.5px] text-ink-3">
                    At{" "}
                    <span className="font-mono font-medium tabular-nums text-ink">
                      {formatNumber(workflow.runCount)}
                    </span>{" "}
                    runs, this pipeline has cost roughly{" "}
                    <span className="font-mono font-medium tabular-nums text-ink">
                      {formatCurrency(estimate.cost * workflow.runCount, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    .
                  </p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={null}>
      <WorkflowsPageInner />
    </Suspense>
  );
}
