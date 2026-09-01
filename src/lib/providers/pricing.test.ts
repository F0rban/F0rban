import { describe, expect, it } from "vitest";
import { estimateLatency, priceRun, priceRunRounded } from "./pricing";

// Sonnet-shaped: $3 in, $15 out per million; 900ms to first token, 88 tok/s.
const model = { inputPrice: 3, outputPrice: 15, latencyMs: 900, throughput: 88 };

describe("priceRun", () => {
  it("prices input and output tokens at their per-million rates", () => {
    expect(priceRun(model, 1_000_000, 0)).toBe(3);
    expect(priceRun(model, 0, 1_000_000)).toBe(15);
    expect(priceRun(model, 500_000, 100_000)).toBeCloseTo(3, 10);
  });

  it("is zero for an empty run", () => {
    expect(priceRun(model, 0, 0)).toBe(0);
  });

  it("rounds a stored cost to the micro-dollar", () => {
    // 9,200 in → $0.0276; 1,400 out → $0.021.
    expect(priceRunRounded(model, 9_200, 1_400)).toBe(0.0486);
    expect(priceRunRounded(model, 1, 1)).toBe(0.000018);
  });
});

describe("estimateLatency", () => {
  it("adds generation time to the first-token wait", () => {
    expect(estimateLatency(model, 880)).toBe(900 + 10_000);
    expect(estimateLatency(model, 0)).toBe(900);
  });
});
