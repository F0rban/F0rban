"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Model, Workflow, WorkflowNode } from "@/lib/data/types";

export type NodeState = "pending" | "running" | "done";

export interface RunStats {
  cost: number;
  tokensIn: number;
  tokensOut: number;
  elapsedMs: number;
}

/** Real cost of one node, from the model's list price and the node's tokens. */
export function nodeCost(node: WorkflowNode, models: Map<string, Model>): number {
  if (!node.modelId) return 0;
  const model = models.get(node.modelId);
  if (!model) return 0;
  return (
    (node.tokensIn / 1_000_000) * model.inputPrice +
    (node.tokensOut / 1_000_000) * model.outputPrice
  );
}

export function workflowCost(workflow: Workflow, models: Map<string, Model>): number {
  return workflow.nodes.reduce((sum, node) => sum + nodeCost(node, models), 0);
}

/** Longest path through the graph — the wall clock, not the sum of steps. */
export function criticalPathMs(workflow: Workflow): number {
  const byId = new Map(workflow.nodes.map((n) => [n.id, n]));
  const incoming = new Map<string, string[]>();
  for (const edge of workflow.edges) {
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge.from]);
  }
  const memo = new Map<string, number>();

  const visit = (id: string, seen: Set<string>): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const node = byId.get(id);
    if (!node) return 0;
    const parents = incoming.get(id) ?? [];
    const longestParent = parents.length
      ? Math.max(...parents.map((parent) => visit(parent, new Set(seen))))
      : 0;
    const value = longestParent + node.durationMs;
    memo.set(id, value);
    return value;
  };

  return workflow.nodes.reduce((max, node) => Math.max(max, visit(node.id, new Set())), 0);
}

/** Execution order: left to right by column, top to bottom within a column. */
export function runOrder(workflow: Workflow): WorkflowNode[] {
  return [...workflow.nodes].sort((a, b) => a.column - b.column || a.row - b.row);
}

const MIN_STEP = 320;
const MAX_STEP = 1100;

/**
 * Steps through a workflow for demonstration.
 *
 * Deliberately a simulation, not an execution engine: it replays the recorded
 * timings and token counts at a watchable speed and accumulates the real cost
 * from current model prices. No requests are made anywhere.
 */
export function useWorkflowRun(workflow: Workflow, models: Map<string, Model>) {
  const order = useMemo(() => runOrder(workflow), [workflow]);
  const [index, setIndex] = useState(-1);
  const [status, setStatus] = useState<"idle" | "running" | "complete">("idle");
  const [stats, setStats] = useState<RunStats>({ cost: 0, tokensIn: 0, tokensOut: 0, elapsedMs: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    clear();
    setIndex(-1);
    setStatus("idle");
    setStats({ cost: 0, tokensIn: 0, tokensOut: 0, elapsedMs: 0 });
  }, [workflow.id, clear]);

  useEffect(() => () => clear(), [clear]);

  useEffect(() => {
    if (status !== "running") return;
    const next = index + 1;
    if (next >= order.length) {
      setStatus("complete");
      return;
    }

    const node = order[next]!;
    // Compress real durations into something watchable while keeping the
    // relative weight of each step.
    const delay = Math.min(MAX_STEP, Math.max(MIN_STEP, node.durationMs / 28));

    timer.current = setTimeout(() => {
      setIndex(next);
      setStats((prev) => ({
        cost: prev.cost + nodeCost(node, models),
        tokensIn: prev.tokensIn + node.tokensIn,
        tokensOut: prev.tokensOut + node.tokensOut,
        elapsedMs: prev.elapsedMs + node.durationMs,
      }));
    }, delay);

    return clear;
  }, [status, index, order, models, clear]);

  const start = useCallback(() => {
    clear();
    setIndex(-1);
    setStats({ cost: 0, tokensIn: 0, tokensOut: 0, elapsedMs: 0 });
    setStatus("running");
  }, [clear]);

  const stop = useCallback(() => {
    clear();
    setStatus("idle");
  }, [clear]);

  const reset = useCallback(() => {
    clear();
    setIndex(-1);
    setStatus("idle");
    setStats({ cost: 0, tokensIn: 0, tokensOut: 0, elapsedMs: 0 });
  }, [clear]);

  const nodeStates = useMemo(() => {
    const map = new Map<string, NodeState>();
    order.forEach((node, i) => {
      map.set(node.id, i < index ? "done" : i === index ? (status === "complete" ? "done" : "running") : "pending");
    });
    if (status === "complete") for (const node of order) map.set(node.id, "done");
    if (status === "idle" && index === -1) for (const node of order) map.set(node.id, "pending");
    return map;
  }, [order, index, status]);

  return {
    status,
    stats,
    nodeStates,
    activeNodeId: index >= 0 ? (order[index]?.id ?? null) : null,
    progress: order.length ? Math.max(0, index + 1) / order.length : 0,
    start,
    stop,
    reset,
  };
}
