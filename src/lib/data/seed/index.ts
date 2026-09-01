import type { Preferences, Project, Prompt, Tool, Workspace } from "../types";
import { SEED_MODELS } from "./models";
import { SEED_PROJECTS } from "./projects";
import { SEED_PROMPTS } from "./prompts";
import { SEED_TOOLS } from "./tools";
import { generateDuels, SEED_TASK_PROFILES } from "./duels";
import { addDays, generateActivity, generateSpend, toDayKey } from "./generate";

// 2: duels carry `sample`, so the worked example and the user's own record can
// be told apart. Older prototype workspaces are dropped rather than migrated.
export const WORKSPACE_VERSION = 2;

const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  monthlyBudget: 420,
  currency: "USD",
  displayName: "",
  onboardingComplete: false,
  focusModelIds: [],
  compactDensity: false,
  reduceMotion: false,
  usingSampleData: true,
};

function isoAt(now: Date, daysAgo: number): string {
  return addDays(now, -daysAgo).toISOString();
}

function resolveTools(now: Date): Tool[] {
  return SEED_TOOLS.map(({ addedDaysAgo, lastUsedDaysAgo, renewsInDays, ...rest }) => ({
    ...rest,
    addedAt: isoAt(now, addedDaysAgo),
    lastUsedAt: lastUsedDaysAgo === null ? null : isoAt(now, lastUsedDaysAgo),
    renewsOn: renewsInDays === null ? null : toDayKey(addDays(now, renewsInDays)),
  }));
}

function resolvePrompts(now: Date): Prompt[] {
  return SEED_PROMPTS.map(
    ({ createdDaysAgo, updatedDaysAgo, lastUsedDaysAgo, versionHistory, ...rest }) => ({
      ...rest,
      createdAt: isoAt(now, createdDaysAgo),
      updatedAt: isoAt(now, updatedDaysAgo),
      lastUsedAt: lastUsedDaysAgo === null ? null : isoAt(now, lastUsedDaysAgo),
      versions: versionHistory.map((v, i) => ({
        id: `${rest.id}-v${i + 1}`,
        body: v.body,
        createdAt: isoAt(now, v.daysAgo),
        note: v.note,
      })),
    }),
  );
}

function resolveProjects(now: Date): Project[] {
  return SEED_PROJECTS.map(
    ({ createdDaysAgo, updatedDaysAgo, dueInDays, taskList, ...rest }) => ({
      ...rest,
      createdAt: isoAt(now, createdDaysAgo),
      updatedAt: isoAt(now, updatedDaysAgo),
      dueDate: dueInDays === null ? null : toDayKey(addDays(now, dueInDays)),
      tasks: taskList.map((task, i) => ({
        id: `${rest.id}-t${i + 1}`,
        title: task.title,
        done: task.done,
        dueDate: task.dueInDays === null ? null : toDayKey(addDays(now, task.dueInDays)),
      })),
    }),
  );
}

/**
 * Builds a complete workspace relative to `now`, so a freshly opened app always
 * shows a live-looking 13 months of history. Deterministic for a given date.
 */
export function createSeedWorkspace(now: Date = new Date()): Workspace {
  return {
    version: WORKSPACE_VERSION,
    tools: resolveTools(now),
    models: SEED_MODELS.map((m) => ({ ...m })),
    prompts: resolvePrompts(now),
    projects: resolveProjects(now),
    duels: generateDuels(now),
    taskProfiles: SEED_TASK_PROFILES.map((p) => ({ ...p })),
    spend: generateSpend(now),
    activity: generateActivity(now),
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

export * from "./providers";
