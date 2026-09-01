import type { Duel } from "@/lib/data/types";

/** Anonymous labels while judging. A, B, C — never the model's name. */
export const BLIND_LABELS = ["A", "B", "C", "D"] as const;

export function blindLabel(index: number): string {
  return BLIND_LABELS[index] ?? String.fromCharCode(65 + index);
}

/**
 * A stable but non-obvious presentation order.
 *
 * If entries always rendered in the order they were created, "A" would always
 * be the model you picked first — and after a week you would know which column
 * is the expensive one. Shuffling by a hash of the duel id keeps the order
 * stable across renders while decoupling it from creation order.
 */
export function blindOrder(duel: Duel): number[] {
  let hash = 0;
  for (let i = 0; i < duel.id.length; i++) hash = (hash * 31 + duel.id.charCodeAt(i)) >>> 0;
  const indices = duel.entries.map((_, i) => i);
  // Fisher-Yates driven by the hash, so it is deterministic per duel.
  for (let i = indices.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    const j = hash % (i + 1);
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return indices;
}


/** What the winner cost against the most expensive alternative. */
export function costSpread(duel: Duel): { cheapest: number; dearest: number; ratio: number } {
  const costs = duel.entries.map((e) => e.cost).filter((c) => c > 0);
  if (costs.length === 0) return { cheapest: 0, dearest: 0, ratio: 1 };
  const cheapest = Math.min(...costs);
  const dearest = Math.max(...costs);
  return { cheapest, dearest, ratio: cheapest > 0 ? dearest / cheapest : 1 };
}

