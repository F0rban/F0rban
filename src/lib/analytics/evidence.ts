import type { Duel, TaskProfile, Workspace } from "../data/types";
import { SEED_TASK_PROFILES } from "../data/seed/duels";

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

/** True while a task profile still holds exactly the example's numbers. */
function isSeedProfile(profile: TaskProfile): boolean {
  const seed = SEED_TASK_PROFILES.find((p) => p.taskType === profile.taskType);
  return (
    !!seed &&
    seed.currentModelId === profile.currentModelId &&
    seed.runsPerMonth === profile.runsPerMonth &&
    seed.avgTokensIn === profile.avgTokensIn &&
    seed.avgTokensOut === profile.avgTokensOut
  );
}

/**
 * Drops the worked example from a workspace, keeping the library.
 *
 * Prompts, models and tools are reference material, not evidence — they stay.
 * Usage counters and the activity feed describe the example's history, so they
 * go with it. So do the example's habits: a volume profile the user never
 * touched is reset to "not set" (token shapes stay as neutral defaults), so a
 * fresh record is never priced against someone else's 12,000 classifications a
 * month. A profile the user already edited is theirs, and survives. Pure, so
 * the store can call it from more than one action.
 */
export function withoutSampleEvidence(workspace: Workspace): Workspace {
  return {
    ...workspace,
    duels: ownDuels(workspace.duels),
    prompts: workspace.prompts.map((prompt) => ({ ...prompt, useCount: 0, lastUsedAt: null })),
    taskProfiles: workspace.taskProfiles.map((profile) =>
      isSeedProfile(profile) ? { ...profile, currentModelId: "", runsPerMonth: 0 } : profile,
    ),
    activity: [],
    preferences: { ...workspace.preferences, usingSampleData: false },
  };
}
