import { describe, expect, it } from "vitest";
import { createSeedWorkspace } from "@/lib/data/seed";
import { revealFor } from "./reveal";

const ws = createSeedWorkspace(new Date(2026, 4, 20));

describe("revealFor", () => {
  it("measures the record with and without this duel", () => {
    const duel = ws.duels.find((d) => d.status === "decided" && !d.tie)!;
    const reveal = revealFor(duel, ws);

    expect(reveal.after.sampleSize).toBe(reveal.before.sampleSize + 1);
    const winsBefore =
      reveal.before.standings.find((s) => s.modelId === duel.winnerModelId)?.wins ?? 0;
    const winsAfter = reveal.after.standings.find((s) => s.modelId === duel.winnerModelId)!.wins;
    expect(winsAfter).toBe(winsBefore + 1);
    expect(reveal.leader).not.toBeNull();
  });

  it("prices a cheaper winner against the dearest model it beat", () => {
    // Sonnet beat Opus on the auth middleware rewrite.
    const duel = ws.duels.find((d) => d.id === "d-code-review-1")!;
    const reveal = revealFor(duel, ws);
    expect(reveal.winner!.model.id).toBe("m-claude-sonnet-45");
    expect(reveal.rival!.model.id).toBe("m-claude-opus-45");
    expect(reveal.costRatio!).toBeLessThan(1);
  });

  it("prices a dearer winner against the cheapest alternative", () => {
    // Opus caught the double-refund race.
    const duel = ws.duels.find((d) => d.id === "d-code-review-0")!;
    const reveal = revealFor(duel, ws);
    expect(reveal.winner!.model.id).toBe("m-claude-opus-45");
    expect(reveal.costRatio!).toBeGreaterThan(1);
  });

  it("has no winner or rival for a tie, but still knows the price spread", () => {
    const tie = ws.duels.find((d) => d.tie)!;
    const reveal = revealFor(tie, ws);
    expect(reveal.winner).toBeNull();
    expect(reveal.rival).toBeNull();
    expect(reveal.cheapest).not.toBeNull();
    expect(reveal.dearest!.entry.cost).toBeGreaterThanOrEqual(reveal.cheapest!.entry.cost);
  });

  it("offers the next open duel, same kind of work first", () => {
    const pending = ws.duels.filter((d) => d.status === "pending");
    expect(pending.length).toBeGreaterThan(1);
    const reveal = revealFor(pending[0]!, ws);
    expect(reveal.nextPending?.id).toBe(pending[1]!.id);
  });

  it("offers nothing when nothing is waiting", () => {
    const decidedOnly = { ...ws, duels: ws.duels.filter((d) => d.status === "decided") };
    expect(revealFor(decidedOnly.duels[0]!, decidedOnly).nextPending).toBeNull();
  });
});
