import { describe, expect, it } from "vitest";
import { createSeedWorkspace } from "@/lib/data/seed";
import { ManualRunner, type DuelRunner } from "./runner";
import { CONNECTABLE, registerRunner, runnerFor } from "./registry";

const ws = createSeedWorkspace(new Date(2026, 4, 20));
const sonnet = ws.models.find((m) => m.id === "m-claude-sonnet-45")!;

describe("ManualRunner", () => {
  it("returns a priced estimate with nothing to paste yet", async () => {
    const result = await new ManualRunner().run({
      model: sonnet,
      prompt: "Review this diff.",
      expectedTokensIn: 1_000,
      expectedTokensOut: 100,
    });
    expect(result.output).toBe("");
    expect(result.source).toBe("manual");
    expect(result.tokensIn).toBe(1_000);
    expect(result.tokensOut).toBe(100);
    // $3/M in + $15/M out.
    expect(result.cost).toBeCloseTo(0.0045, 6);
    expect(result.latencyMs).toBeGreaterThan(sonnet.latencyMs);
  });
});

describe("registry", () => {
  it("drives every provider by hand until one is connected", () => {
    expect(runnerFor("anthropic").kind).toBe("manual");
    expect(runnerFor("openai").kind).toBe("manual");
    expect(runnerFor("other").kind).toBe("manual");
    expect(CONNECTABLE.every((c) => !c.available)).toBe(true);
  });

  it("prefers a connected provider runner for its own provider only", async () => {
    const fake: DuelRunner = {
      id: "fake-anthropic",
      kind: "api",
      supports: (provider) => provider === "anthropic",
      run: async () => ({
        output: "measured",
        tokensIn: 1,
        tokensOut: 1,
        latencyMs: 1,
        cost: 0.000018,
        source: "api",
      }),
    };
    registerRunner(fake);

    expect(runnerFor("anthropic").id).toBe("fake-anthropic");
    expect(runnerFor("openai").kind).toBe("manual");

    const result = await runnerFor("anthropic").run({
      model: sonnet,
      prompt: "x",
      expectedTokensIn: 0,
      expectedTokensOut: 0,
    });
    expect(result.source).toBe("api");
    expect(result.output).toBe("measured");
  });
});
