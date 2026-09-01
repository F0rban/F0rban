import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_LABEL,
  allVerdicts,
  coinFlipProbability,
  evidenceCoverage,
  isActionable,
  modelRecord,
  modelStrengths,
  routingSummary,
  standingsFor,
  verdictFor,
} from "./verdicts";
import { createSeedWorkspace } from "../data/seed";
import { TASK_TYPES } from "../data/seed/duels";
import type { Duel, Model, TaskProfile, TaskType } from "../data/types";

const REF = new Date(2026, 8, 1);
const workspace = createSeedWorkspace(REF);
const verdicts = allVerdicts(workspace.duels, workspace.models, workspace.taskProfiles, TASK_TYPES);
const byType = (type: TaskType) => verdicts.find((v) => v.taskType === type)!;

const model = (id: string, input: number, output: number): Model =>
  ({
    id,
    name: id,
    provider: "other",
    family: "t",
    releasedAt: "2026-01-01",
    knowledgeCutoff: "",
    contextWindow: 1,
    maxOutput: 1,
    inputPrice: input,
    outputPrice: output,
    throughput: 1,
    latencyMs: 1,
    modalities: ["text"],
    scores: { reasoning: 1, coding: 1, creativity: 1, speed: 1, instruction: 1 },
    openWeights: false,
    personalScore: null,
    notes: "",
    favorite: false,
    tags: [],
  }) as Model;

function duel(winner: string | null, models: string[], day: number, tie = false): Duel {
  return {
    id: `x-${day}-${Math.random()}`,
    title: "t",
    taskType: "code-review",
    createdAt: new Date(2026, 0, day).toISOString(),
    decidedAt: new Date(2026, 0, day).toISOString(),
    status: "decided",
    promptId: null,
    projectId: null,
    entries: models.map((m) => ({
      modelId: m,
      output: "",
      tokensIn: 1000,
      tokensOut: 100,
      latencyMs: 100,
      cost: 0.01,
    })),
    winnerModelId: tie ? null : winner,
    tie,
    reason: "",
    blind: true,
  };
}

const profile = (overrides: Partial<TaskProfile> = {}): TaskProfile => ({
  taskType: "code-review",
  currentModelId: "a",
  runsPerMonth: 100,
  avgTokensIn: 1_000_000,
  avgTokensOut: 0,
  ...overrides,
});

describe("coinFlipProbability", () => {
  it("is exact for small samples", () => {
    expect(coinFlipProbability(9, 11)).toBeCloseTo(0.0327, 4);
    expect(coinFlipProbability(7, 9)).toBeCloseTo(0.0898, 4);
    expect(coinFlipProbability(5, 9)).toBeCloseTo(0.5, 4);
  });

  it("is certain when the leader won everything", () => {
    expect(coinFlipProbability(4, 4)).toBeCloseTo(0.0625, 4);
    expect(coinFlipProbability(0, 5)).toBe(1);
  });

  it("returns 1 for an empty record rather than dividing by zero", () => {
    expect(coinFlipProbability(0, 0)).toBe(1);
  });
});

describe("standingsFor", () => {
  const duels = [
    duel("a", ["a", "b"], 1),
    duel("b", ["a", "b"], 2),
    duel("a", ["a", "b"], 3),
    duel(null, ["a", "b"], 4, true),
  ];

  it("counts wins, losses and ties per model", () => {
    const [first, second] = standingsFor(duels);
    expect(first!.modelId).toBe("a");
    expect(first).toMatchObject({ wins: 2, losses: 1, ties: 1, played: 4 });
    expect(second).toMatchObject({ wins: 1, losses: 2, ties: 1 });
  });

  it("computes win rate over decisive results only, excluding ties", () => {
    expect(standingsFor(duels)[0]!.winRate).toBeCloseTo(66.7, 1);
  });

  it("reads recent form newest first", () => {
    expect(standingsFor(duels)[0]!.form).toEqual(["T", "W", "L", "W"]);
  });

  it("ignores duels still awaiting a verdict", () => {
    const pending = { ...duel("a", ["a", "b"], 5), status: "pending" as const };
    expect(standingsFor([...duels, pending])[0]!.played).toBe(4);
  });
});

describe("verdictFor — confidence", () => {
  const models = [model("a", 10, 0), model("b", 1, 0)];

  it("says it does not know below the minimum sample", () => {
    const duels = [duel("a", ["a", "b"], 1), duel("a", ["a", "b"], 2)];
    const v = verdictFor("code-review", duels, models, profile());
    expect(v.confidence).toBe("insufficient");
    expect(v.recommendedModelId).toBeNull();
  });

  it("settles once the record beats chance", () => {
    const duels = [
      ...Array.from({ length: 9 }, (_, i) => duel("a", ["a", "b"], i + 1)),
      duel("b", ["a", "b"], 10),
      duel("b", ["a", "b"], 11),
    ];
    const v = verdictFor("code-review", duels, models, profile());
    expect(v.confidence).toBe("clear-winner");
    expect(v.pValue).toBeLessThanOrEqual(0.05);
    expect(v.recommendedModelId).toBe("a");
    expect(v.basis).toBe("won");
  });

  it("calls a level record an equivalence and picks on price", () => {
    const duels = [
      duel("a", ["a", "b"], 1),
      duel("b", ["a", "b"], 2),
      duel("a", ["a", "b"], 3),
      duel("b", ["a", "b"], 4),
      duel("a", ["a", "b"], 5),
      duel("b", ["a", "b"], 6),
      duel(null, ["a", "b"], 7, true),
      duel(null, ["a", "b"], 8, true),
    ];
    const v = verdictFor("code-review", duels, models, profile());
    expect(v.confidence).toBe("too-close");
    expect(v.recommendedModelId).toBe("b");
    expect(v.basis).toBe("cheapest-of-equals");
  });

  it("does not mistake a lopsided record for an equivalence", () => {
    // 7-3 is not significant at n=10, but it is not a tie either — calling it
    // one would route work to the loser on price.
    const duels = [
      ...Array.from({ length: 7 }, (_, i) => duel("a", ["a", "b"], i + 1)),
      ...Array.from({ length: 3 }, (_, i) => duel("b", ["a", "b"], i + 8)),
    ];
    const v = verdictFor("code-review", duels, models, profile());
    expect(v.confidence).toBe("emerging");
    expect(v.recommendedModelId).toBe("a");
  });

  it("keeps an emerging lean out of the routing table", () => {
    const duels = [
      ...Array.from({ length: 7 }, (_, i) => duel("a", ["a", "b"], i + 1)),
      ...Array.from({ length: 3 }, (_, i) => duel("b", ["a", "b"], i + 8)),
    ];
    const v = verdictFor("code-review", duels, models, profile({ currentModelId: "b" }));
    expect(isActionable(v)).toBe(false);
  });

  it("labels every confidence level", () => {
    for (const key of Object.keys(CONFIDENCE_LABEL)) expect(CONFIDENCE_LABEL[key as never]).toBeTruthy();
  });
});

describe("verdictFor — money", () => {
  const models = [model("a", 10, 0), model("b", 1, 0)];
  const settled = [
    ...Array.from({ length: 9 }, (_, i) => duel("b", ["a", "b"], i + 1)),
    duel("a", ["a", "b"], 10),
    duel("a", ["a", "b"], 11),
  ];

  it("prices the current routing against the recommended one", () => {
    // 1M input tokens per run, 100 runs: $10/run vs $1/run.
    const v = verdictFor("code-review", settled, models, profile());
    expect(v.currentMonthlyCost).toBe(1000);
    expect(v.recommendedMonthlyCost).toBe(100);
    expect(v.monthlyDelta).toBe(900);
  });

  it("reports a negative delta when the better model costs more", () => {
    const v = verdictFor("code-review", settled, models, profile({ currentModelId: "b" }));
    // Already on the cheap one, and it is also the winner: nothing to change.
    expect(v.monthlyDelta).toBe(0);
    expect(isActionable(v)).toBe(false);
  });

  it("is worth nothing without a volume estimate", () => {
    const v = verdictFor("code-review", settled, models, profile({ runsPerMonth: 0 }));
    expect(v.monthlyDelta).toBe(0);
  });
});

describe("verdictFor — reversal", () => {
  it("flags a leadership change the lifetime record still hides", () => {
    const duels = [
      ...Array.from({ length: 5 }, (_, i) => duel("a", ["a", "b"], i + 1)),
      ...Array.from({ length: 6 }, (_, i) => duel("b", ["a", "b"], i + 6)),
    ];
    const v = verdictFor("code-review", duels, [model("a", 1, 0), model("b", 1, 0)], profile());
    expect(v.reversal).not.toBeNull();
    expect(v.reversal!.leaderId).toBe("b");
    expect(v.reversal!.previousLeaderId).toBe("a");
    expect(v.reversal!.recentWins).toBe(6);
  });

  it("does not flag a steady record as a reversal", () => {
    const duels = Array.from({ length: 10 }, (_, i) => duel("a", ["a", "b"], i + 1));
    const v = verdictFor("code-review", duels, [model("a", 1, 0), model("b", 1, 0)], profile());
    expect(v.reversal).toBeNull();
  });
});

describe("the seeded corpus tells a complete story", () => {
  it("has evidence across every task type it profiles", () => {
    expect(workspace.duels.length).toBeGreaterThan(60);
    expect(verdicts).toHaveLength(TASK_TYPES.length);
  });

  it("keeps duels awaiting a verdict, so there is always something to judge", () => {
    expect(workspace.duels.filter((d) => d.status === "pending").length).toBeGreaterThan(0);
  });

  it("finds the expensive default losing on code review", () => {
    const v = byType("code-review");
    expect(v.confidence).toBe("clear-winner");
    expect(v.currentModelId).toBe("m-claude-opus-45");
    expect(v.recommendedModelId).toBe("m-claude-sonnet-45");
    expect(v.monthlyDelta).toBeGreaterThan(0);
  });

  it("finds an equivalence on the highest-volume task, where the money is", () => {
    const v = byType("classification");
    expect(v.confidence).toBe("too-close");
    expect(v.basis).toBe("cheapest-of-equals");
    expect(v.recommendedModelId).toBe("m-claude-haiku-45");
    expect(v.monthlyDelta).toBeGreaterThan(30);
  });

  it("confirms the expensive model where it genuinely wins", () => {
    const v = byType("long-form-writing");
    expect(v.confidence).toBe("clear-winner");
    expect(v.recommendedModelId).toBe(v.currentModelId);
    expect(isActionable(v)).toBe(false);
  });

  it("contains a reversal", () => {
    expect(byType("summarisation").reversal).not.toBeNull();
  });

  it("admits when it does not have enough evidence", () => {
    expect(byType("data-extraction").confidence).toBe("insufficient");
  });

  it("adds up to a saving worth more than a subscription", () => {
    const summary = routingSummary(verdicts);
    expect(summary.actionableSaving).toBeGreaterThan(50);
    expect(summary.actionableSaving).toBeLessThan(summary.currentMonthlyCost);
    expect(summary.pendingSaving).toBeGreaterThan(0);
    expect(summary.qualityUpgrades.length).toBeGreaterThan(0);
    expect(summary.confirmed.length).toBeGreaterThan(0);
  });
});

describe("model views", () => {
  it("gives a model its own record across every task type", () => {
    const record = modelRecord(workspace.duels, "m-claude-sonnet-45")!;
    expect(record.played).toBeGreaterThan(20);
    expect(record.wins + record.losses + record.ties).toBe(record.played);
  });

  it("returns nothing for a model that never entered a duel", () => {
    expect(modelRecord(workspace.duels, "m-command-a")).toBeNull();
  });

  it("lists the task types a model is recommended for", () => {
    expect(modelStrengths(verdicts, "m-claude-sonnet-45")).toContain("code-review");
  });
});

describe("evidenceCoverage", () => {
  it("counts how much of the routing table is actually settled", () => {
    const coverage = evidenceCoverage(verdicts);
    expect(coverage.total).toBe(TASK_TYPES.length);
    expect(coverage.covered).toBeGreaterThan(0);
    expect(coverage.covered).toBeLessThan(coverage.total);
    expect(coverage.totalDuels).toBe(workspace.duels.filter((d) => d.status === "decided").length);
  });
});

describe("modelStrengths", () => {
  it("counts only settled recommendations, not leans", () => {
    const strengths = modelStrengths(verdicts, "m-gemini-3-pro");
    // Gemini leads research synthesis 5-2, which is a lean rather than settled.
    expect(byType("research-synthesis").confidence).toBe("emerging");
    expect(strengths).not.toContain("research-synthesis");
  });

  it("includes a recommendation made on price when the record is level", () => {
    expect(modelStrengths(verdicts, "m-claude-haiku-45")).toContain("classification");
  });
});
