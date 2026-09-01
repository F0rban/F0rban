import type { Duel, DuelEntry, Model, Workspace } from "@/lib/data/types";
import { verdictFor, type Standing, type Verdict } from "@/lib/analytics/verdicts";

/**
 * Everything the reveal needs to say, computed once.
 *
 * The reveal is the product's strongest moment, so it has to be specific: not
 * "X won" but what X cost against what it beat, and what that single click did
 * to the record for this kind of work. "Before" is the verdict with this duel
 * removed, "after" is the verdict with it in — the difference is the duel's
 * contribution, whether it was judged a minute or a month ago.
 */

export interface Contender {
  model: Model;
  entry: DuelEntry;
}

export interface Reveal {
  winner: Contender | null;
  /**
   * The alternative the winner is priced against: the dearest model it beat
   * when it was the cheapest, otherwise the cheapest one it cost more than.
   * Null for a tie or a one-model duel.
   */
  rival: Contender | null;
  /** Winner cost ÷ rival cost. 0.25 means a quarter of the price. */
  costRatio: number | null;
  /** Winner latency ÷ rival latency. */
  latencyRatio: number | null;
  cheapest: Contender | null;
  dearest: Contender | null;
  before: Verdict;
  after: Verdict;
  /** The model leading this kind of work after the verdict. */
  leader: Model | null;
  leaderBefore: Standing | null;
  leaderAfter: Standing | null;
  /** The next duel still waiting, same kind of work first. */
  nextPending: Duel | null;
}

function safeRatio(a: number, b: number): number | null {
  return a > 0 && b > 0 ? a / b : null;
}

export function revealFor(duel: Duel, workspace: Workspace): Reveal {
  const models = new Map(workspace.models.map((m) => [m.id, m]));
  const contenders: Contender[] = duel.entries.flatMap((entry) => {
    const model = models.get(entry.modelId);
    return model ? [{ model, entry }] : [];
  });

  const byCost = [...contenders].sort((a, b) => a.entry.cost - b.entry.cost);
  const cheapest = byCost[0] ?? null;
  const dearest = byCost[byCost.length - 1] ?? null;

  const winner = contenders.find((c) => c.model.id === duel.winnerModelId) ?? null;
  let rival: Contender | null = null;
  if (winner) {
    const others = contenders.filter((c) => c !== winner);
    if (others.length > 0) {
      const cheaperThanAll = others.every((o) => winner.entry.cost <= o.entry.cost);
      rival = others.reduce((pick, o) =>
        cheaperThanAll
          ? o.entry.cost > pick.entry.cost ? o : pick
          : o.entry.cost < pick.entry.cost ? o : pick,
      );
    }
  }

  const profile = workspace.taskProfiles.find((p) => p.taskType === duel.taskType);
  const before = verdictFor(
    duel.taskType,
    workspace.duels.filter((d) => d.id !== duel.id),
    workspace.models,
    profile,
  );
  const after = verdictFor(duel.taskType, workspace.duels, workspace.models, profile);

  const leaderAfter = after.standings[0] ?? null;
  const leader = leaderAfter ? (models.get(leaderAfter.modelId) ?? null) : null;
  const leaderBefore = leaderAfter
    ? (before.standings.find((s) => s.modelId === leaderAfter.modelId) ?? null)
    : null;

  const nextPending =
    workspace.duels
      .filter((d) => d.status === "pending" && d.id !== duel.id)
      .sort(
        (a, b) =>
          Number(b.taskType === duel.taskType) - Number(a.taskType === duel.taskType) ||
          b.createdAt.localeCompare(a.createdAt),
      )[0] ?? null;

  return {
    winner,
    rival,
    costRatio: winner && rival ? safeRatio(winner.entry.cost, rival.entry.cost) : null,
    latencyRatio: winner && rival ? safeRatio(winner.entry.latencyMs, rival.entry.latencyMs) : null,
    cheapest,
    dearest,
    before,
    after,
    leader,
    leaderBefore,
    leaderAfter,
    nextPending,
  };
}
