import type { Duel, Workspace } from "../data/types";

/**
 * Whose evidence is on screen.
 *
 * The product's one promise is "this is *your* record". Every sentence that
 * says "your" therefore has to be able to say "the example's" instead, and the
 * switch has to live in one place rather than in twenty ternaries. A workspace
 * is in `example` mode until the user starts their first own duel, at which
 * point the seeded rows are removed and it flips to `own` for good.
 */
export type EvidenceMode = "example" | "own";

export function evidenceMode(workspace: Pick<Workspace, "preferences">): EvidenceMode {
  return workspace.preferences.usingSampleData ? "example" : "own";
}

export function sampleDuels(duels: Duel[]): Duel[] {
  return duels.filter((duel) => duel.sample);
}

export function ownDuels(duels: Duel[]): Duel[] {
  return duels.filter((duel) => !duel.sample);
}

/**
 * Drops the worked example from a workspace, keeping the library.
 *
 * Prompts, models and tools are reference material, not evidence — they stay.
 * Usage counters and the activity feed describe the example's history, so they
 * go with it. Pure, so the store can call it from more than one action.
 */
export function withoutSampleEvidence(workspace: Workspace): Workspace {
  return {
    ...workspace,
    duels: ownDuels(workspace.duels),
    prompts: workspace.prompts.map((prompt) => ({ ...prompt, useCount: 0, lastUsedAt: null })),
    activity: [],
    preferences: { ...workspace.preferences, usingSampleData: false },
  };
}
