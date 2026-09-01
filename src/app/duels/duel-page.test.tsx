import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { DuelDetail } from "@/features/duels/duel-detail";
import DuelsPage from "./page";
import { currentWorkspace, renderApp, seedStore } from "@/test/utils";
import { resetRouter, setRoute } from "@/test/next-navigation";

const pendingId = () =>
  currentWorkspace().duels.find((d) => d.status === "pending")!.id;

beforeEach(() => {
  resetRouter();
  setRoute("/duels");
  seedStore();
});

describe("duels list", () => {
  it("puts duels awaiting a verdict first, whatever their date", async () => {
    renderApp(<DuelsPage />);
    // Query by list item rather than by accessible link name: computing the
    // name of 72 links is what made this test time out under load.
    const rows = await screen.findAllByRole("listitem");
    expect(rows.length).toBe(currentWorkspace().duels.length);
    const pending = currentWorkspace().duels.filter((d) => d.status === "pending").length;
    for (const row of rows.slice(0, pending)) {
      expect(within(row).getByText("Judge this")).toBeInTheDocument();
    }
    expect(within(rows[pending]!).queryByText("Judge this")).not.toBeInTheDocument();
  });

  it("lands on the queue when linked with ?status=pending", async () => {
    setRoute("/duels", { status: "pending" });
    renderApp(<DuelsPage />);
    const expected = currentWorkspace().duels.filter((d) => d.status === "pending").length;
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(expected));
    expect(screen.getByRole("radio", { name: /Waiting/ })).toBeChecked();
  });

  it("filters to the ones still waiting", async () => {
    const { user } = renderApp(<DuelsPage />);
    await screen.findAllByRole("listitem");
    await user.click(screen.getByRole("radio", { name: /Waiting/ }));

    const expected = currentWorkspace().duels.filter((d) => d.status === "pending").length;
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(expected));
  });

  it("searches titles and the reasons recorded with a verdict", async () => {
    const { user } = renderApp(<DuelsPage />);
    await screen.findAllByRole("listitem");
    await user.type(screen.getByRole("searchbox", { name: /search duels/i }), "race");
    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThan(currentWorkspace().duels.length);
    });
  });
});

describe("judging a duel", () => {
  it("hides model identity and price while a verdict is pending", async () => {
    const id = pendingId();
    renderApp(<DuelDetail id={id} />);

    expect(await screen.findByText("Answer A")).toBeInTheDocument();
    expect(screen.getByText("Answer B")).toBeInTheDocument();

    const duel = currentWorkspace().duels.find((d) => d.id === id)!;
    for (const entry of duel.entries) {
      const model = currentWorkspace().models.find((m) => m.id === entry.modelId)!;
      expect(screen.queryByText(model.name)).not.toBeInTheDocument();
    }
    // Cost is the strongest bias of all, so it is hidden too.
    expect(screen.queryByText(/^Cost/)).not.toBeInTheDocument();
  });

  it("will not record a verdict until a winner is picked", async () => {
    renderApp(<DuelDetail id={pendingId()} />);
    expect(await screen.findByRole("button", { name: /record verdict/i })).toBeDisabled();
  });

  it("records a winner, then reveals the names and the prices", async () => {
    const id = pendingId();
    const { user } = renderApp(<DuelDetail id={id} />);

    await user.click((await screen.findAllByRole("button", { name: /this one won/i }))[0]!);
    await user.type(screen.getByLabelText(/reason for the verdict/i), "Found the real bug.");
    await user.click(screen.getByRole("button", { name: /record verdict/i }));

    await waitFor(() => {
      const duel = currentWorkspace().duels.find((d) => d.id === id)!;
      expect(duel.status).toBe("decided");
      expect(duel.winnerModelId).not.toBeNull();
      expect(duel.reason).toBe("Found the real bug.");
    });

    const winnerId = currentWorkspace().duels.find((d) => d.id === id)!.winnerModelId!;
    const model = currentWorkspace().models.find((m) => m.id === winnerId)!;
    expect(await screen.findByText(/You picked/)).toHaveTextContent(model.name);
    // Manual entries are estimates, and the label says so.
    const entries = currentWorkspace().duels.find((d) => d.id === id)!.entries.length;
    expect(screen.getAllByText("Cost (est.)")).toHaveLength(entries);
  });

  it("the reveal says what the verdict did to the record and offers the next duel", async () => {
    const id = pendingId();
    const { user } = renderApp(<DuelDetail id={id} />);
    await user.click((await screen.findAllByRole("button", { name: /this one won/i }))[0]!);
    await user.click(screen.getByRole("button", { name: /record verdict/i }));

    const reveal = await screen.findByRole("region", { name: /the reveal/i });
    // The three things the click changed: record, confidence, routing.
    expect(within(reveal).getByText(/ record$/)).toBeInTheDocument();
    expect(within(reveal).getByText("Confidence")).toBeInTheDocument();
    expect(within(reveal).getByText("Routing")).toBeInTheDocument();
    // And the way out is another duel, not a dead end. A second sample duel is
    // still open, so it is offered first.
    expect(within(reveal).getByRole("link", { name: /judge the next one/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/duels\/d-/),
    );
    expect(within(reveal).getByRole("link", { name: /run another/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/duels/new?task="),
    );
    expect(within(reveal).getByRole("link", { name: /see verdicts/i })).toHaveAttribute(
      "href",
      "/verdicts",
    );
  });

  it("says how much cheaper the winner was when it beat a dearer model", async () => {
    const duel = currentWorkspace().duels.find((d) => {
      if (d.status !== "decided" || d.tie) return false;
      const winner = d.entries.find((e) => e.modelId === d.winnerModelId)!;
      return d.entries.some((e) => e.cost > winner.cost * 1.5);
    })!;
    renderApp(<DuelDetail id={duel.id} />);
    expect(await screen.findByText(/× less/)).toBeInTheDocument();
  });

  it("says when the winner cost more, rather than hiding it", async () => {
    const duel = currentWorkspace().duels.find((d) => {
      if (d.status !== "decided" || d.tie) return false;
      const winner = d.entries.find((e) => e.modelId === d.winnerModelId)!;
      return d.entries.every((e) => e.cost * 1.5 <= winner.cost || e === winner);
    })!;
    renderApp(<DuelDetail id={duel.id} />);
    expect(await screen.findByText(/× more/)).toBeInTheDocument();
  });

  it("labels a sample duel's reveal as the worked example's, not the user's", async () => {
    const sample = currentWorkspace().duels.find((d) => d.status === "decided" && d.sample)!;
    renderApp(<DuelDetail id={sample.id} />);
    expect(await screen.findByText(/moved the worked example's record/)).toBeInTheDocument();
  });

  it("records a tie without a winner", async () => {
    const id = pendingId();
    const { user } = renderApp(<DuelDetail id={id} />);
    await user.click(await screen.findByRole("button", { name: /indistinguishable/i }));

    await waitFor(() => {
      const duel = currentWorkspace().duels.find((d) => d.id === id)!;
      expect(duel.tie).toBe(true);
      expect(duel.status).toBe("decided");
    });
    expect(await screen.findByText("Judged indistinguishable")).toBeInTheDocument();
  });

  it("stores a pasted answer against the right entry", async () => {
    const id = pendingId();
    renderApp(<DuelDetail id={id} />);
    const boxes = await screen.findAllByRole("textbox", { name: /paste the answer/i });
    // The field exists to be pasted into, so drive it as a paste.
    fireEvent.change(boxes[0]!, { target: { value: "The answer." } });

    await waitFor(() => expect(boxes[0]).toHaveValue("The answer."));
    const duel = currentWorkspace().duels.find((d) => d.id === id)!;
    expect(duel.entries.filter((e) => e.output === "The answer.")).toHaveLength(1);
    expect(duel.entries.filter((e) => e.output === "")).toHaveLength(duel.entries.length - 1);
  });

  it("shows the model's overall record once revealed", async () => {
    const decided = currentWorkspace().duels.find((d) => d.status === "decided" && !d.tie)!;
    renderApp(<DuelDetail id={decided.id} />);
    expect(await screen.findAllByText(/overall$/)).toHaveLength(decided.entries.length);
  });

  it("explains itself when the duel does not exist", async () => {
    renderApp(<DuelDetail id="nope" />);
    expect(await screen.findByText("Duel not found")).toBeInTheDocument();
  });
});
