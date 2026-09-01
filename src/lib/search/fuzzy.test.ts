import { describe, expect, it } from "vitest";
import { fuzzyMatch, fuzzyMatchFields, highlightSegments } from "./fuzzy";

describe("fuzzyMatch", () => {
  it("matches an exact substring and reports its positions", () => {
    const match = fuzzyMatch("son", "Claude Sonnet 4.5")!;
    expect(match).not.toBeNull();
    expect(match.positions).toEqual([7, 8, 9]);
  });

  it("is case-insensitive", () => {
    expect(fuzzyMatch("CLAUDE", "claude opus")).not.toBeNull();
    expect(fuzzyMatch("claude", "CLAUDE OPUS")).not.toBeNull();
  });

  it("matches a subsequence when there is no substring", () => {
    const match = fuzzyMatch("cop", "Claude Opus")!;
    expect(match).not.toBeNull();
    expect(match.positions).toHaveLength(3);
  });

  it("returns null when a character is missing", () => {
    expect(fuzzyMatch("zzz", "Claude Opus")).toBeNull();
  });

  it("returns a neutral match for an empty query", () => {
    expect(fuzzyMatch("", "anything")).toEqual({ score: 1, positions: [] });
  });

  it("ranks a prefix above a mid-string hit", () => {
    const prefix = fuzzyMatch("cla", "Claude Opus")!;
    const middle = fuzzyMatch("cla", "Anthropic Claude")!;
    expect(prefix.score).toBeGreaterThan(middle.score);
  });

  it("ranks a word-boundary hit above an arbitrary one", () => {
    const boundary = fuzzyMatch("lab", "Model Lab")!;
    const inner = fuzzyMatch("lab", "Collaborate")!;
    expect(boundary.score).toBeGreaterThan(inner.score);
  });

  it("ranks an exact substring above a scattered subsequence", () => {
    const substring = fuzzyMatch("prompt", "Prompt Vault")!;
    const scattered = fuzzyMatch("prompt", "Personal Reports On Model Performance Tracking")!;
    expect(substring.score).toBeGreaterThan(scattered.score);
  });

  it("prefers the shorter of two equally-positioned matches", () => {
    const short = fuzzyMatch("gpt", "GPT-5.1")!;
    const long = fuzzyMatch("gpt", "GPT-5.1 mini with a very long trailing name")!;
    expect(short.score).toBeGreaterThan(long.score);
  });
});

describe("fuzzyMatchFields", () => {
  const fields = [
    { text: "Claude Opus 4.5", weight: 1, primary: true },
    { text: "Best for architecture", weight: 0.35 },
  ];

  it("returns positions only for the primary field", () => {
    const title = fuzzyMatchFields("opus", fields)!;
    expect(title.fieldIndex).toBe(0);
    expect(title.positions.length).toBeGreaterThan(0);

    const body = fuzzyMatchFields("architecture", fields)!;
    expect(body.fieldIndex).toBe(1);
    expect(body.positions).toEqual([]);
  });

  it("weights a title hit above a body hit", () => {
    const weighted = fuzzyMatchFields("claude", [
      { text: "Claude", weight: 1, primary: true },
      { text: "Claude", weight: 0.35 },
    ])!;
    expect(weighted.fieldIndex).toBe(0);
  });

  it("returns null when nothing matches any field", () => {
    expect(fuzzyMatchFields("xyzzy", fields)).toBeNull();
  });

  it("skips empty fields without crashing", () => {
    expect(fuzzyMatchFields("a", [{ text: "", weight: 1 }, { text: "abc", weight: 1 }])).not.toBeNull();
  });
});

describe("highlightSegments", () => {
  it("splits into alternating plain and matched runs", () => {
    expect(highlightSegments("Sonnet", [0, 1, 2])).toEqual([
      { text: "Son", match: true },
      { text: "net", match: false },
    ]);
  });

  it("handles a match in the middle", () => {
    expect(highlightSegments("abcd", [1, 2])).toEqual([
      { text: "a", match: false },
      { text: "bc", match: true },
      { text: "d", match: false },
    ]);
  });

  it("returns one plain segment when there is nothing to highlight", () => {
    expect(highlightSegments("abc", [])).toEqual([{ text: "abc", match: false }]);
  });

  it("reassembles into the original string", () => {
    const text = "Adversarial code review";
    const joined = highlightSegments(text, [0, 1, 4, 12])
      .map((s) => s.text)
      .join("");
    expect(joined).toBe(text);
  });
});
