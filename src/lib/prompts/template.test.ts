import { describe, expect, it } from "vitest";
import {
  defaultValues,
  estimateTokens,
  extractVariableNames,
  renderSegments,
  renderTemplate,
  syncVariables,
  variableRanges,
} from "./template";
import type { PromptVariable } from "../data/types";

const variable = (name: string, extra: Partial<PromptVariable> = {}): PromptVariable => ({
  name,
  label: name,
  description: "",
  type: "text",
  defaultValue: "",
  ...extra,
});

describe("extractVariableNames", () => {
  it("finds placeholders in body order", () => {
    expect(extractVariableNames("Hi {{name}}, you are {{role}}.")).toEqual(["name", "role"]);
  });

  it("deduplicates repeated placeholders", () => {
    expect(extractVariableNames("{{a}} then {{a}} again")).toEqual(["a"]);
  });

  it("tolerates whitespace inside the braces", () => {
    expect(extractVariableNames("{{ spaced }}")).toEqual(["spaced"]);
  });

  it("ignores single braces and unclosed placeholders", () => {
    expect(extractVariableNames("{not} and {{unclosed")).toEqual([]);
  });

  it("returns nothing for a body with no placeholders", () => {
    expect(extractVariableNames("plain text")).toEqual([]);
  });
});

describe("renderTemplate", () => {
  it("substitutes provided values", () => {
    const result = renderTemplate("Hello {{name}}", { name: "Alex" });
    expect(result.text).toBe("Hello Alex");
    expect(result.missing).toEqual([]);
    expect(result.filled).toBe(1);
    expect(result.total).toBe(1);
  });

  it("leaves unfilled placeholders visible instead of blanking them", () => {
    const result = renderTemplate("Hello {{name}}", {});
    expect(result.text).toBe("Hello {{name}}");
    expect(result.missing).toEqual(["name"]);
    expect(result.filled).toBe(0);
  });

  it("treats a whitespace-only value as unfilled", () => {
    const result = renderTemplate("Hello {{name}}", { name: "   " });
    expect(result.missing).toEqual(["name"]);
    expect(result.text).toBe("Hello {{name}}");
  });

  it("substitutes every occurrence of a repeated placeholder", () => {
    expect(renderTemplate("{{x}}-{{x}}", { x: "1" }).text).toBe("1-1");
  });

  it("counts partial fills correctly", () => {
    const result = renderTemplate("{{a}} {{b}} {{c}}", { a: "1", c: "3" });
    expect(result.filled).toBe(2);
    expect(result.total).toBe(3);
    expect(result.missing).toEqual(["b"]);
  });

  it("ignores values for variables the body does not use", () => {
    const result = renderTemplate("Hello", { unused: "x" });
    expect(result.text).toBe("Hello");
    expect(result.total).toBe(0);
  });

  it("does not re-expand a value that itself looks like a placeholder", () => {
    const result = renderTemplate("{{a}}", { a: "{{b}}", b: "boom" });
    expect(result.text).toBe("{{b}}");
  });
});

describe("renderSegments", () => {
  it("marks filled and missing runs separately", () => {
    const segments = renderSegments("A {{x}} B {{y}}", { x: "1" });
    expect(segments).toEqual([
      { text: "A ", kind: "text" },
      { text: "1", kind: "filled", name: "x" },
      { text: " B ", kind: "text" },
      { text: "{{y}}", kind: "missing", name: "y" },
    ]);
  });

  it("reassembles into the rendered text", () => {
    const body = "Start {{a}} middle {{b}} end";
    const values = { a: "AAA" };
    const joined = renderSegments(body, values)
      .map((s) => s.text)
      .join("");
    expect(joined).toBe(renderTemplate(body, values).text);
  });

  it("returns a single text segment for a body with no placeholders", () => {
    expect(renderSegments("plain", {})).toEqual([{ text: "plain", kind: "text" }]);
  });
});

describe("syncVariables", () => {
  it("keeps existing definitions for placeholders still in the body", () => {
    const existing = [variable("topic", { label: "The topic", description: "keep me" })];
    const next = syncVariables("About {{topic}}", existing);
    expect(next).toHaveLength(1);
    expect(next[0]!.description).toBe("keep me");
  });

  it("adds a stub for a newly typed placeholder, with a humanised label", () => {
    const next = syncVariables("{{target_audience}}", []);
    expect(next[0]!.name).toBe("target_audience");
    expect(next[0]!.label).toBe("Target audience");
    expect(next[0]!.type).toBe("text");
  });

  it("humanises camelCase names too", () => {
    expect(syncVariables("{{targetAudience}}", [])[0]!.label).toBe("Target Audience");
  });

  it("drops definitions whose placeholder is gone", () => {
    const existing = [variable("gone"), variable("kept")];
    const next = syncVariables("{{kept}}", existing);
    expect(next.map((v) => v.name)).toEqual(["kept"]);
  });

  it("preserves body order rather than the previous definition order", () => {
    const existing = [variable("b"), variable("a")];
    expect(syncVariables("{{a}} {{b}}", existing).map((v) => v.name)).toEqual(["a", "b"]);
  });
});

describe("variableRanges", () => {
  it("reports the character span of each placeholder", () => {
    expect(variableRanges("ab {{x}} cd")).toEqual([{ start: 3, end: 8, name: "x" }]);
  });
});

describe("defaultValues", () => {
  it("seeds the fill-in panel from declared defaults", () => {
    const values = defaultValues({
      variables: [variable("tone", { defaultValue: "Direct" }), variable("draft")],
    });
    expect(values).toEqual({ tone: "Direct", draft: "" });
  });
});

describe("estimateTokens", () => {
  it("approximates four characters per token", () => {
    expect(estimateTokens("a".repeat(400))).toBe(100);
    expect(estimateTokens("")).toBe(0);
  });
});
