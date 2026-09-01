import { describe, expect, it } from "vitest";
import { collapseContext, diffLines, diffStat, type DiffLine } from "./diff";

const types = (lines: DiffLine[]) => lines.map((l) => l.type);
const texts = (lines: DiffLine[]) => lines.map((l) => l.text);

describe("diffLines", () => {
  it("marks identical text as unchanged", () => {
    expect(types(diffLines("a\nb", "a\nb"))).toEqual(["same", "same"]);
  });

  it("detects an inserted line without disturbing its neighbours", () => {
    const lines = diffLines("a\nc", "a\nb\nc");
    expect(types(lines)).toEqual(["same", "add", "same"]);
    expect(texts(lines)).toEqual(["a", "b", "c"]);
  });

  it("detects a removed line", () => {
    const lines = diffLines("a\nb\nc", "a\nc");
    expect(types(lines)).toEqual(["same", "remove", "same"]);
  });

  it("represents a replacement as a removal plus an addition", () => {
    const lines = diffLines("a\nold\nc", "a\nnew\nc");
    expect(types(lines)).toEqual(["same", "remove", "add", "same"]);
  });

  it("keeps every line of both texts accounted for", () => {
    const before = "one\ntwo\nthree\nfour";
    const after = "one\nTWO\nthree\nfive\nsix";
    const lines = diffLines(before, after);
    const oldSide = lines.filter((l) => l.type !== "add").map((l) => l.text);
    const newSide = lines.filter((l) => l.type !== "remove").map((l) => l.text);
    expect(oldSide).toEqual(before.split("\n"));
    expect(newSide).toEqual(after.split("\n"));
  });

  it("numbers lines against the side they belong to", () => {
    const lines = diffLines("a\nb", "a\nx\nb");
    const added = lines.find((l) => l.type === "add")!;
    expect(added.oldLine).toBeNull();
    expect(added.newLine).toBe(2);
  });

  it("handles an empty side", () => {
    expect(types(diffLines("", "a\nb"))).toEqual(["remove", "add", "add"]);
    expect(diffStat(diffLines("a\nb\nc", ""))).toEqual({ added: 1, removed: 3 });
  });

  it("finds the minimal edit rather than replacing the whole block", () => {
    const lines = diffLines("1\n2\n3\n4\n5", "1\n2\nX\n4\n5");
    expect(diffStat(lines)).toEqual({ added: 1, removed: 1 });
  });
});

describe("collapseContext", () => {
  it("hides unchanged stretches beyond the context window", () => {
    const before = Array.from({ length: 20 }, (_, i) => `line ${i}`).join("\n");
    const after = before.replace("line 10", "line TEN");
    const collapsed = collapseContext(diffLines(before, after), 2);

    const gaps = collapsed.filter((row) => row.type === "gap");
    expect(gaps.length).toBeGreaterThan(0);
    expect(collapsed.length).toBeLessThan(21);
  });

  it("keeps everything when the change touches most of the text", () => {
    const collapsed = collapseContext(diffLines("a\nb", "x\ny"), 2);
    expect(collapsed.some((row) => row.type === "gap")).toBe(false);
  });

  it("returns a single gap for two identical texts", () => {
    const collapsed = collapseContext(diffLines("a\nb\nc", "a\nb\nc"), 2);
    expect(collapsed).toEqual([{ type: "gap", count: 3 }]);
  });
});
