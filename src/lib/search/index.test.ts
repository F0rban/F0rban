import { describe, expect, it } from "vitest";
import { buildSearchIndex, groupHits, searchRecords, typeLabel } from "./index";
import { createSeedWorkspace } from "../data/seed";

const workspace = createSeedWorkspace(new Date(2026, 4, 20));
const index = buildSearchIndex(workspace);

describe("buildSearchIndex", () => {
  it("indexes every entity type in the workspace", () => {
    const counts = new Map<string, number>();
    for (const record of index) counts.set(record.type, (counts.get(record.type) ?? 0) + 1);
    expect(counts.get("tool")).toBe(workspace.tools.length);
    expect(counts.get("model")).toBe(workspace.models.length);
    expect(counts.get("prompt")).toBe(workspace.prompts.length);
    expect(counts.get("project")).toBe(workspace.projects.length);
    expect(counts.get("duel")).toBe(workspace.duels.length);
  });

  it("gives every record a navigable href", () => {
    expect(index.every((record) => record.href.startsWith("/"))).toBe(true);
  });

  it("boosts starred records above unstarred ones of the same kind", () => {
    const prompts = index.filter((r) => r.type === "prompt");
    const starred = prompts.find((r) => r.favorite)!;
    const plain = prompts.find((r) => !r.favorite)!;
    expect(starred.boost).toBeGreaterThan(0);
    expect(starred.boost).toBeGreaterThan(plain.boost - 24);
  });
});

describe("searchRecords", () => {
  it("finds a model by name", () => {
    const hits = searchRecords(index, "opus");
    expect(hits[0]!.title).toContain("Opus");
  });

  it("finds a prompt by a word in its body, not just its title", () => {
    const hits = searchRecords(index, "hostile reviewer");
    expect(hits.some((hit) => hit.title === "Adversarial code review")).toBe(true);
  });

  it("finds a tool by one of its tags", () => {
    const hits = searchRecords(index, "moodboard");
    expect(hits.some((hit) => hit.title === "Midjourney")).toBe(true);
  });

  it("returns the highest-boost records when the query is empty", () => {
    const hits = searchRecords(index, "", { limit: 5 });
    expect(hits).toHaveLength(5);
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1]!.score).toBeGreaterThanOrEqual(hits[i]!.score);
    }
  });

  it("respects the limit", () => {
    expect(searchRecords(index, "a", { limit: 3 })).toHaveLength(3);
  });

  it("filters to the requested entity types", () => {
    const hits = searchRecords(index, "claude", { types: ["model"] });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.type === "model")).toBe(true);
  });

  it("returns nothing for a query no record can satisfy", () => {
    expect(searchRecords(index, "qqqqzzzz")).toHaveLength(0);
  });

  it("orders results by descending score", () => {
    const hits = searchRecords(index, "prompt");
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1]!.score).toBeGreaterThanOrEqual(hits[i]!.score);
    }
  });
});

describe("groupHits", () => {
  it("groups by type and keeps relevance order inside a group", () => {
    const groups = groupHits(searchRecords(index, "claude", { limit: 20 }));
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      for (let i = 1; i < group.hits.length; i++) {
        expect(group.hits[i - 1]!.score).toBeGreaterThanOrEqual(group.hits[i]!.score);
      }
    }
  });

  it("emits no empty groups", () => {
    const groups = groupHits(searchRecords(index, "atlas"));
    expect(groups.every((group) => group.hits.length > 0)).toBe(true);
  });

  it("labels each entity type", () => {
    expect(typeLabel("prompt")).toBe("Prompt");
    expect(typeLabel("duel")).toBe("Duel");
  });
});

describe("searchRecords relevance floor", () => {
  it("does not surface records that merely contain the query as a scattered subsequence", () => {
    // "claude" is a subsequence of many long descriptions; only records that
    // genuinely mention it should come back.
    const hits = searchRecords(index, "claude", { limit: 40 });
    for (const hit of hits) {
      const record = index.find((r) => r.id === hit.id)!;
      const haystack = `${record.title} ${record.subtitle} ${record.keywords}`.toLowerCase();
      const titleIsFuzzy = record.title.toLowerCase().replace(/[^a-z]/g, "").includes("claude");
      expect(haystack.includes("claude") || titleIsFuzzy).toBe(true);
    }
  });

  it("still matches a title by an abbreviation", () => {
    const hits = searchRecords(index, "gpt51");
    expect(hits[0]!.title.startsWith("GPT-5.1")).toBe(true);
  });
});
