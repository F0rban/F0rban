import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaceStore } from "./workspace";
import { MemoryAdapter } from "../data/adapter";
import { createSeedWorkspace } from "../data/seed";

const REF = new Date(2026, 4, 20);

/** Fresh store + in-memory adapter for every test. */
async function boot() {
  const adapter = new MemoryAdapter(createSeedWorkspace(REF));
  useWorkspaceStore.setState({ status: "idle", workspace: null, adapter });
  await useWorkspaceStore.getState().hydrate();
  return adapter;
}

const state = () => useWorkspaceStore.getState();
const ws = () => state().workspace!;

beforeEach(async () => {
  await boot();
});

describe("hydration", () => {
  it("loads a persisted workspace through the adapter", () => {
    expect(state().status).toBe("ready");
    expect(ws().prompts.length).toBeGreaterThan(0);
  });

  it("seeds a fresh workspace when the adapter is empty", async () => {
    useWorkspaceStore.setState({ status: "idle", workspace: null, adapter: new MemoryAdapter(null) });
    await state().hydrate();
    expect(ws().tools.length).toBeGreaterThan(0);
  });

  it("writes the seeded workspace back so the next load is stable", async () => {
    const adapter = new MemoryAdapter(null);
    useWorkspaceStore.setState({ status: "idle", workspace: null, adapter });
    await state().hydrate();
    expect(await adapter.load()).not.toBeNull();
  });
});

describe("prompts", () => {
  it("creates a prompt and derives its variables from the body", () => {
    const before = ws().prompts.length;
    const id = state().createPrompt({ title: "Test", body: "Hello {{name}} and {{other}}" });
    expect(ws().prompts).toHaveLength(before + 1);
    const prompt = ws().prompts.find((p) => p.id === id)!;
    expect(prompt.variables.map((v) => v.name)).toEqual(["name", "other"]);
    expect(prompt.useCount).toBe(0);
  });

  it("falls back to a title rather than saving an empty one", () => {
    const id = state().createPrompt({ title: "   ", body: "" });
    expect(ws().prompts.find((p) => p.id === id)!.title).toBe("Untitled prompt");
  });

  it("logs prompt creation to the activity timeline", () => {
    state().createPrompt({ title: "Logged", body: "x" });
    expect(ws().activity[0]!.title).toContain("Logged");
    expect(ws().activity[0]!.kind).toBe("prompt.created");
  });

  it("updates a prompt and re-syncs its variables", () => {
    const id = state().createPrompt({ title: "T", body: "{{a}}" });
    state().updatePrompt(id, { body: "{{a}} {{b}}" });
    expect(ws().prompts.find((p) => p.id === id)!.variables.map((v) => v.name)).toEqual(["a", "b"]);
  });

  it("keeps the previous body as a version when the body changes", () => {
    const id = state().createPrompt({ title: "T", body: "first" });
    state().updatePrompt(id, { body: "second" }, { note: "reworded" });
    const prompt = ws().prompts.find((p) => p.id === id)!;
    expect(prompt.body).toBe("second");
    expect(prompt.versions).toHaveLength(1);
    expect(prompt.versions[0]!.body).toBe("first");
    expect(prompt.versions[0]!.note).toBe("reworded");
  });

  it("does not create a version when only metadata changes", () => {
    const id = state().createPrompt({ title: "T", body: "same" });
    state().updatePrompt(id, { title: "Renamed" });
    expect(ws().prompts.find((p) => p.id === id)!.versions).toHaveLength(0);
  });

  it("restores an earlier version and keeps what it replaced", () => {
    const id = state().createPrompt({ title: "T", body: "v1" });
    state().updatePrompt(id, { body: "v2" });
    const versionId = ws().prompts.find((p) => p.id === id)!.versions[0]!.id;
    state().restorePromptVersion(id, versionId);
    const prompt = ws().prompts.find((p) => p.id === id)!;
    expect(prompt.body).toBe("v1");
    expect(prompt.versions.some((v) => v.body === "v2")).toBe(true);
  });

  it("duplicates a prompt next to the original, without its history or usage", () => {
    const source = ws().prompts.find((p) => p.versions.length > 0 && p.useCount > 0)!;
    const sourceIndex = ws().prompts.findIndex((p) => p.id === source.id);
    const copyId = state().duplicatePrompt(source.id)!;
    const copy = ws().prompts.find((p) => p.id === copyId)!;

    expect(ws().prompts[sourceIndex + 1]!.id).toBe(copyId);
    expect(copy.title).toBe(`${source.title} (copy)`);
    expect(copy.body).toBe(source.body);
    expect(copy.versions).toEqual([]);
    expect(copy.useCount).toBe(0);
    expect(copy.favorite).toBe(false);
  });

  it("returns null when duplicating a prompt that does not exist", () => {
    expect(state().duplicatePrompt("nope")).toBeNull();
  });

  it("deletes a prompt and unlinks it from every project", () => {
    const project = ws().projects.find((p) => p.promptIds.length > 0)!;
    const promptId = project.promptIds[0]!;
    state().deletePrompt(promptId);
    expect(ws().prompts.some((p) => p.id === promptId)).toBe(false);
    expect(ws().projects.find((p) => p.id === project.id)!.promptIds).not.toContain(promptId);
  });

  it("toggles a favourite both ways", () => {
    const id = ws().prompts[0]!.id;
    const before = ws().prompts[0]!.favorite;
    state().togglePromptFavorite(id);
    expect(ws().prompts.find((p) => p.id === id)!.favorite).toBe(!before);
    state().togglePromptFavorite(id);
    expect(ws().prompts.find((p) => p.id === id)!.favorite).toBe(before);
  });

  it("records a run, bumping the count and the last-used timestamp", () => {
    const prompt = ws().prompts[0]!;
    const before = prompt.useCount;
    state().recordPromptRun(prompt.id);
    const after = ws().prompts.find((p) => p.id === prompt.id)!;
    expect(after.useCount).toBe(before + 1);
    expect(after.lastUsedAt).not.toBeNull();
    expect(ws().activity[0]!.kind).toBe("prompt.run");
  });
});

describe("tools", () => {
  it("toggles a tool favourite", () => {
    const id = ws().tools[0]!.id;
    const before = ws().tools[0]!.favorite;
    state().toggleToolFavorite(id);
    expect(ws().tools.find((t) => t.id === id)!.favorite).toBe(!before);
  });

  it("logs a status change but not an unrelated edit", () => {
    const tool = ws().tools.find((t) => t.status === "active")!;
    state().updateTool(tool.id, { notes: "just a note" });
    expect(ws().activity[0]!.kind).not.toBe("tool.status");
    state().updateTool(tool.id, { status: "paused" });
    expect(ws().activity[0]!.kind).toBe("tool.status");
  });

  it("adds and removes a tool", () => {
    const id = state().addTool({
      name: "New Tool",
      provider: "other",
      category: "assistant",
      description: "d",
      status: "trial",
      monthlyCost: 5,
      billingCycle: "monthly",
      seats: 1,
      primaryModelId: null,
      url: "#",
      notes: "",
      favorite: false,
      tags: [],
      lastUsedAt: null,
      usage30d: 0,
      renewsOn: null,
    });
    expect(ws().tools[0]!.id).toBe(id);
    state().deleteTool(id);
    expect(ws().tools.some((t) => t.id === id)).toBe(false);
  });
});

describe("models", () => {
  it("stores a personal score and logs it", () => {
    const id = ws().models[0]!.id;
    state().scoreModel(id, 9.5);
    expect(ws().models.find((m) => m.id === id)!.personalScore).toBe(9.5);
    expect(ws().activity[0]!.kind).toBe("model.scored");
  });

  it("clears a score without logging a meaningless event", () => {
    const id = ws().models[0]!.id;
    const activityBefore = ws().activity[0]!.id;
    state().scoreModel(id, null);
    expect(ws().models.find((m) => m.id === id)!.personalScore).toBeNull();
    expect(ws().activity[0]!.id).toBe(activityBefore);
  });
});

describe("projects", () => {
  it("creates a project, deriving a code from the name when none is given", () => {
    const id = state().createProject({ name: "Beacon" });
    expect(ws().projects.find((p) => p.id === id)!.code).toBe("BEA");
  });

  it("toggles a task and logs only completion, not un-completion", () => {
    const project = ws().projects.find((p) => p.tasks.some((t) => !t.done))!;
    const task = project.tasks.find((t) => !t.done)!;

    state().toggleTask(project.id, task.id);
    expect(ws().projects.find((p) => p.id === project.id)!.tasks.find((t) => t.id === task.id)!.done).toBe(true);
    expect(ws().activity[0]!.detail).toContain(task.title);

    const afterFirst = ws().activity[0]!.id;
    state().toggleTask(project.id, task.id);
    expect(ws().projects.find((p) => p.id === project.id)!.tasks.find((t) => t.id === task.id)!.done).toBe(false);
    expect(ws().activity[0]!.id).toBe(afterFirst);
  });

  it("adds and removes a task", () => {
    const project = ws().projects[0]!;
    const before = project.tasks.length;
    state().addTask(project.id, "Ship it");
    const added = ws().projects.find((p) => p.id === project.id)!;
    expect(added.tasks).toHaveLength(before + 1);
    state().removeTask(project.id, added.tasks[added.tasks.length - 1]!.id);
    expect(ws().projects.find((p) => p.id === project.id)!.tasks).toHaveLength(before);
  });

  it("deletes a project without leaving duels pointing at it", () => {
    const project = ws().projects[0]!;
    state().deleteProject(project.id);
    expect(ws().projects.some((p) => p.id === project.id)).toBe(false);
  });
});

describe("duels", () => {
  it("starts a duel in the pending state and logs it", () => {
    const models = ws().models.slice(0, 2);
    const id = state().startDuel({
      title: "Refactor the ingest worker",
      taskType: "code-review",
      promptId: null,
      projectId: null,
      blind: true,
      entries: models.map((m) => ({
        modelId: m.id,
        output: "",
        tokensIn: 4000,
        tokensOut: 800,
        latencyMs: 1200,
        cost: 0.02,
      })),
    });
    const duel = ws().duels.find((d) => d.id === id)!;
    expect(duel.status).toBe("pending");
    expect(duel.winnerModelId).toBeNull();
    expect(ws().activity[0]!.kind).toBe("duel.started");
  });

  it("records a verdict, the winner and the reason", () => {
    const pending = ws().duels.find((d) => d.status === "pending")!;
    const winner = pending.entries[1]!.modelId;
    state().decideDuel(pending.id, winner, "Caught the race the other missed.");
    const duel = ws().duels.find((d) => d.id === pending.id)!;
    expect(duel.status).toBe("decided");
    expect(duel.winnerModelId).toBe(winner);
    expect(duel.tie).toBe(false);
    expect(duel.decidedAt).not.toBeNull();
    expect(ws().activity[0]!.kind).toBe("duel.decided");
  });

  it("records a tie when no winner is chosen", () => {
    const pending = ws().duels.find((d) => d.status === "pending")!;
    state().decideDuel(pending.id, null, "Indistinguishable.");
    const duel = ws().duels.find((d) => d.id === pending.id)!;
    expect(duel.tie).toBe(true);
    expect(duel.winnerModelId).toBeNull();
  });

  it("stores a pasted output against one model only", () => {
    const duel = ws().duels[0]!;
    const modelId = duel.entries[0]!.modelId;
    state().updateDuelEntry(duel.id, modelId, "The answer.");
    const updated = ws().duels.find((d) => d.id === duel.id)!;
    expect(updated.entries.find((e) => e.modelId === modelId)!.output).toBe("The answer.");
    expect(updated.entries[1]!.output).toBe("");
  });

  it("deletes a duel", () => {
    const id = ws().duels[0]!.id;
    state().deleteDuel(id);
    expect(ws().duels.some((d) => d.id === id)).toBe(false);
  });

  it("updates a task profile in place", () => {
    state().updateTaskProfile("classification", { runsPerMonth: 999 });
    expect(ws().taskProfiles.find((p) => p.taskType === "classification")!.runsPerMonth).toBe(999);
  });
});

describe("preferences and reset", () => {
  it("merges a preference patch without clobbering the rest", () => {
    state().updatePreferences({ monthlyBudget: 999 });
    expect(ws().preferences.monthlyBudget).toBe(999);
    expect(ws().preferences.currency).toBe("USD");
  });

  it("completing onboarding stars the chosen models", () => {
    const ids = [ws().models[3]!.id, ws().models[5]!.id];
    state().completeOnboarding({ monthlyBudget: 250, focusModelIds: ids });
    expect(ws().preferences.onboardingComplete).toBe(true);
    expect(ws().preferences.monthlyBudget).toBe(250);
    for (const id of ids) {
      expect(ws().models.find((m) => m.id === id)!.favorite).toBe(true);
    }
  });

  it("reset restores the seeded workspace", async () => {
    const id = state().createPrompt({ title: "Temporary", body: "x" });
    await state().reset();
    expect(ws().prompts.some((p) => p.id === id)).toBe(false);
  });
});

describe("activity log", () => {
  it("prepends newest first and stays bounded", () => {
    for (let i = 0; i < 260; i++) state().createPrompt({ title: `P${i}`, body: "x" });
    expect(ws().activity.length).toBeLessThanOrEqual(240);
    expect(ws().activity[0]!.title).toContain("P259");
  });
});
