import { describe, expect, it } from "vitest";
import { createSeedWorkspace } from "../data/seed";
import { TASK_TYPES } from "../data/seed/duels";
import type { TaskType } from "../data/types";
import { allVerdicts, confidenceLabel, explainVerdict } from "./verdicts";

const ws = createSeedWorkspace(new Date(2026, 4, 20));
const verdicts = allVerdicts(ws.duels, ws.models, ws.taskProfiles, TASK_TYPES);
const byType = (type: TaskType) => verdicts.find((v) => v.taskType === type)!;
const explain = (type: TaskType) => explainVerdict(byType(type), ws.models);

describe("explainVerdict", () => {
  it("names the winner, the count and the chance for strong evidence", () => {
    const text = explain("code-review");
    expect(text).toContain("Claude Sonnet 4.5 won 9 of 11 decisive duels");
    expect(text).toMatch(/by chance about 3 times in 100/);
  });

  it("says price decided when the models are level", () => {
    const text = explain("classification");
    expect(text).toMatch(/^Level across 12 duels \(5–4–3\)/);
    expect(text).toContain("Claude Haiku 4.5 is the cheaper of the two");
  });

  it("calls a lean a lean, with the chance it is luck", () => {
    const text = explain("summarisation");
    expect(text).toContain("Claude Sonnet 4.5 is ahead 7–3");
    expect(text).toMatch(/by chance about \d+ times in 100/);
    expect(text).toContain("Not a rule yet");
  });

  it("counts down to the first verdict when evidence is thin", () => {
    expect(explain("data-extraction")).toBe("2 of 5 results so far — a guess, not a verdict.");
  });

  it("says so when there are no duels at all", () => {
    const empty = allVerdicts([], ws.models, ws.taskProfiles, TASK_TYPES)[0]!;
    expect(explainVerdict(empty, ws.models)).toBe("No duels for this kind of work yet.");
  });
});

describe("confidenceLabel", () => {
  it("scales the word with the evidence", () => {
    expect(confidenceLabel(byType("code-review").confidence, 11)).toBe("Strong evidence");
    expect(confidenceLabel(byType("classification").confidence, 12)).toBe("No difference");
    expect(confidenceLabel(byType("summarisation").confidence, 10)).toBe("Leaning");
    expect(confidenceLabel(byType("data-extraction").confidence, 2)).toBe("Early signal");
  });

  it("does not call zero results a signal", () => {
    expect(confidenceLabel("insufficient", 0)).toBe("No evidence yet");
  });
});
