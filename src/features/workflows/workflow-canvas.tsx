"use client";

import { useMemo } from "react";
import { useMeasure } from "@/components/charts/use-measure";
import {
  ArrowRightToLine,
  Bot,
  Boxes,
  Check,
  FileOutput,
  Loader2,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import type { Model, Tool, Workflow, WorkflowNodeKind } from "@/lib/data/types";
import { formatCompact, formatCurrency, formatDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { NodeState } from "./use-workflow-run";
import { nodeCost } from "./use-workflow-run";

const NODE_W = 168;
const NODE_H = 76;
const GAP_X = 56;
const GAP_Y = 20;
const PAD = 18;

/** Below this, shrinking the graph costs more legibility than it buys. */
const MIN_SCALE = 0.7;

const KIND_ICON: Record<WorkflowNodeKind, React.ElementType> = {
  input: ArrowRightToLine,
  model: Bot,
  tool: Boxes,
  transform: Wand2,
  review: ShieldCheck,
  output: FileOutput,
};

const KIND_SERIES: Record<WorkflowNodeKind, number> = {
  input: 8,
  model: 1,
  tool: 3,
  transform: 6,
  review: 4,
  output: 2,
};

export const KIND_LABEL: Record<WorkflowNodeKind, string> = {
  input: "Input",
  model: "Model",
  tool: "Tool",
  transform: "Transform",
  review: "Gate",
  output: "Output",
};

/**
 * Workflow graph.
 *
 * Nodes carry grid coordinates rather than pixels, so the canvas owns the
 * layout and the seed data stays readable. Edges are cubic beziers with a
 * horizontal control offset, which keeps them clean at any row distance.
 */
export function WorkflowCanvas({
  workflow,
  models,
  tools,
  nodeStates,
  activeNodeId,
  selectedNodeId,
  onSelectNode,
  running,
}: {
  workflow: Workflow;
  models: Map<string, Model>;
  tools: Map<string, Tool>;
  nodeStates: Map<string, NodeState>;
  activeNodeId: string | null;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  running: boolean;
}) {
  const layout = useMemo(() => {
    const columns = Math.max(...workflow.nodes.map((n) => n.column)) + 1;
    const rows = Math.max(...workflow.nodes.map((n) => n.row)) + 1;
    const positions = new Map(
      workflow.nodes.map((node) => [
        node.id,
        {
          x: PAD + node.column * (NODE_W + GAP_X),
          y: PAD + node.row * (NODE_H + GAP_Y),
        },
      ]),
    );
    return {
      positions,
      width: PAD * 2 + columns * NODE_W + (columns - 1) * GAP_X,
      height: PAD * 2 + rows * NODE_H + (rows - 1) * GAP_Y,
    };
  }, [workflow]);

  const edges = useMemo(
    () =>
      workflow.edges
        .map((edge) => {
          const from = layout.positions.get(edge.from);
          const to = layout.positions.get(edge.to);
          if (!from || !to) return null;
          const x1 = from.x + NODE_W;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x;
          const y2 = to.y + NODE_H / 2;
          const offset = Math.max(28, (x2 - x1) * 0.5);
          return {
            ...edge,
            d: `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`,
            labelX: (x1 + x2) / 2,
            labelY: (y1 + y2) / 2 - 7,
            done: nodeStates.get(edge.from) === "done",
            active: activeNodeId === edge.from || activeNodeId === edge.to,
          };
        })
        .filter((edge): edge is NonNullable<typeof edge> => edge !== null),
    [workflow.edges, layout, nodeStates, activeNodeId],
  );

  // Fit-to-width, the way a graph editor does: scale the whole canvas down to
  // the container when the shortfall is mild, and fall back to horizontal
  // scrolling once scaling would make the labels unreadable.
  const { ref: frameRef, width: frameWidth } = useMeasure<HTMLDivElement>();
  const available = Math.max(0, frameWidth - 2);
  const rawScale = available > 0 ? available / layout.width : 1;
  const scale = rawScale >= 1 ? 1 : rawScale >= MIN_SCALE ? rawScale : 1;
  const scaled = scale < 1;

  return (
    <div
      ref={frameRef}
      className={cn(
        "dot-field rounded-xl border border-line bg-surface-1/40",
        scaled ? "overflow-hidden" : "overflow-x-auto",
      )}
    >
      <div
        className="relative origin-top-left"
        style={{
          width: layout.width,
          height: layout.height,
          minWidth: scaled ? undefined : "100%",
          transform: scaled ? `scale(${scale})` : undefined,
          marginBottom: scaled ? layout.height * (scale - 1) : undefined,
        }}
      >
        <svg
          width={layout.width}
          height={layout.height}
          className="absolute inset-0"
          aria-hidden
        >
          <defs>
            <marker
              id="wf-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--line-strong)" />
            </marker>
            <marker
              id="wf-arrow-done"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--accent)" />
            </marker>
          </defs>

          {edges.map((edge) => (
            <g key={edge.id}>
              <path
                d={edge.d}
                fill="none"
                stroke={edge.done ? "var(--accent)" : "var(--line-strong)"}
                strokeWidth={edge.done ? 1.75 : 1.25}
                strokeDasharray={running && edge.active ? "5 7" : undefined}
                markerEnd={`url(#${edge.done ? "wf-arrow-done" : "wf-arrow"})`}
                className={cn(
                  "transition-[stroke,stroke-width] duration-300",
                  running && edge.active && "animate-flow",
                )}
              />
              {edge.label && (
                <text
                  x={edge.labelX}
                  y={edge.labelY}
                  textAnchor="middle"
                  className="fill-[var(--ink-4)] text-[9.5px]"
                >
                  {edge.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {workflow.nodes.map((node) => {
          const position = layout.positions.get(node.id)!;
          const state = nodeStates.get(node.id) ?? "pending";
          const Icon = KIND_ICON[node.kind];
          const color = `var(--series-${KIND_SERIES[node.kind]})`;
          const cost = nodeCost(node, models);
          const model = node.modelId ? models.get(node.modelId) : undefined;
          const tool = node.toolId ? tools.get(node.toolId) : undefined;
          const isSelected = selectedNodeId === node.id;

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node.id)}
              aria-pressed={isSelected}
              className={cn(
                "absolute flex flex-col justify-between rounded-lg border p-2.5 text-left",
                "transition-[border-color,box-shadow,transform,opacity] duration-300",
                state === "running"
                  ? "border-accent bg-surface-1 shadow-md"
                  : state === "done"
                    ? "border-accent-line/70 bg-surface-1"
                    : "border-line bg-surface-1/95",
                isSelected && "ring-2 ring-accent/35",
                state === "pending" && activeNodeId !== null && "opacity-55",
                "hover:border-line-strong hover:shadow-md",
              )}
              style={{ left: position.x, top: position.y, width: NODE_W, height: NODE_H }}
            >
              <span className="flex items-start gap-2">
                <span
                  className="mt-px grid size-5 shrink-0 place-items-center rounded-[6px] border"
                  style={{
                    color,
                    borderColor: `color-mix(in oklch, ${color} 32%, transparent)`,
                    backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
                  }}
                >
                  {state === "running" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : state === "done" ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : (
                    <Icon className="size-3" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-medium leading-tight text-ink">
                    {node.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] leading-tight text-ink-4">
                    {node.subtitle}
                  </span>
                </span>
              </span>

              <span className="flex items-center justify-between gap-2 font-mono text-[9.5px] tabular-nums text-ink-4">
                <span>{formatDuration(node.durationMs)}</span>
                {node.tokensIn + node.tokensOut > 0 && (
                  <span>{formatCompact(node.tokensIn + node.tokensOut)} tok</span>
                )}
                {cost > 0 && (
                  <span className={state === "done" ? "text-accent" : undefined}>
                    {formatCurrency(cost, { maximumFractionDigits: 4 })}
                  </span>
                )}
                {cost === 0 && !model && !tool && <span>—</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
