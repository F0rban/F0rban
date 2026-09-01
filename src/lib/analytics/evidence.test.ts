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
});
