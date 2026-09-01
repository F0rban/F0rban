import { describe, expect, it } from "vitest";
import { createSeedWorkspace } from "../data/seed";
import { TASK_TYPES } from "../data/seed/duels";
import { allVerdicts, routingSummary } from "./verdicts";

const ws = createSeedWorkspace(new Date(2026, 4, 20));

describe("routingSummary without volumes", () => {
  it("keeps settled verdicts on the table as unpriced rather than dropping them", () => {
    // What a fresh own record looks like: the evidence exists, the habits do not.
    const noHabits = ws.taskProfiles.map((p) => ({ ...p, currentModelId: "", runsPerMonth: 0 }));
    const summary = routingSummary(allVerdicts(ws.duels, ws.models, noHabits, TASK_TYPES));

    expect(summary.actionable).toEqual([]);
    expect(summary.qualityUpgrades).toEqual([]);
    expect(summary.confirmed).toEqual([]);
    expect(summary.unpriced.map((v) => v.taskType).sort()).toEqual([
      "classification",
      "code-generation",
      "code-review",
      "long-form-writing",
    ]);
    expect(summary.actionableSaving).toBe(0);
    expect(summary.currentMonthlyCost).toBe(0);
  });

  it("prices them once a habit and a volume exist", () => {
    const summary = routingSummary(allVerdicts(ws.duels, ws.models, ws.taskProfiles, TASK_TYPES));
    expect(summary.unpriced).toEqual([]);
    // Every settled kind of work lands in exactly one priced bucket.
    const priced = [...summary.actionable, ...summary.confirmed, ...summary.qualityUpgrades].map(
      (v) => v.taskType,
    );
    for (const type of ["classification", "code-generation", "code-review", "long-form-writing"]) {
      expect(priced.filter((t) => t === type)).toHaveLength(1);
    }
  });

  it("does not call a verdict unpriced when it agrees with the habit, whatever the volume", () => {
    // Long-form writing: Opus recommended, Opus used, volume zeroed → still "already right".
    const profiles = ws.taskProfiles.map((p) =>
      p.taskType === "long-form-writing" ? { ...p, runsPerMonth: 0 } : p,
    );
    const summary = routingSummary(allVerdicts(ws.duels, ws.models, profiles, TASK_TYPES));
    expect(summary.unpriced.map((v) => v.taskType)).not.toContain("long-form-writing");
    expect(summary.confirmed.map((v) => v.taskType)).toContain("long-form-writing");
  });
});
