import { describe, expect, it } from "vitest";
import { createSeedWorkspace } from "../data/seed";
import { evidenceMode, ownDuels, sampleDuels, withoutSampleEvidence } from "./evidence";

const REF = new Date(2026, 4, 20);

describe("evidence mode", () => {
  it("starts as a worked example, with every seeded duel marked sample", () => {
    const ws = createSeedWorkspace(REF);
    expect(evidenceMode(ws)).toBe("example");
    expect(ws.duels.length).toBeGreaterThan(0);
    expect(sampleDuels(ws.duels)).toHaveLength(ws.duels.length);
    expect(ownDuels(ws.duels)).toHaveLength(0);
  });

  it("drops only the sample rows and keeps the library", () => {
    const ws = createSeedWorkspace(REF);
    const own = { ...ws.duels[0]!, id: "d-mine", sample: false };
    const cleared = withoutSampleEvidence({ ...ws, duels: [own, ...ws.duels] });

    expect(evidenceMode(cleared)).toBe("own");
    expect(cleared.duels).toEqual([own]);
    expect(cleared.prompts).toHaveLength(ws.prompts.length);
    expect(cleared.models).toHaveLength(ws.models.length);
    expect(cleared.activity).toEqual([]);
    // The example's usage history is not the user's either.
    expect(cleared.prompts.every((p) => p.useCount === 0 && p.lastUsedAt === null)).toBe(true);
  });

  it("forgets the example's habits, but keeps any the user already set", () => {
    const ws = createSeedWorkspace(REF);
    const edited = ws.taskProfiles.map((p) =>
      p.taskType === "classification" ? { ...p, runsPerMonth: 500 } : p,
    );
    const cleared = withoutSampleEvidence({ ...ws, taskProfiles: edited });

    const classification = cleared.taskProfiles.find((p) => p.taskType === "classification")!;
    expect(classification.runsPerMonth).toBe(500);
    expect(classification.currentModelId).toBe("m-claude-sonnet-45");

    const untouched = cleared.taskProfiles.filter((p) => p.taskType !== "classification");
    expect(untouched.length).toBeGreaterThan(0);
    expect(untouched.every((p) => p.runsPerMonth === 0 && p.currentModelId === "")).toBe(true);
    // Token shapes are neutral defaults and stay, so alternatives can still be priced.
    expect(untouched.every((p) => p.avgTokensIn > 0)).toBe(true);
  });
});
