import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import VerdictsPage from "./page";
import { currentWorkspace, renderApp, seedStore } from "@/test/utils";
import { resetRouter, setRoute } from "@/test/next-navigation";
import { allVerdicts, evidenceCoverage, routingSummary } from "@/lib/analytics/verdicts";
import { TASK_TYPES } from "@/lib/data/seed/duels";

const summary = () => {
  const ws = currentWorkspace();
  return routingSummary(allVerdicts(ws.duels, ws.models, ws.taskProfiles, TASK_TYPES));
};

beforeEach(() => {
  resetRouter();
  setRoute("/verdicts");
  seedStore();
});

describe("verdicts", () => {
  it("leads with the money, rounded to whole dollars", async () => {
    renderApp(<VerdictsPage />);
    const expected = `$${Math.round(summary().actionableSaving)}`;
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it("groups verdicts by what to do about them", async () => {
    renderApp(<VerdictsPage />);
    expect(await screen.findByText("Change these")).toBeInTheDocument();
    expect(screen.getByText("Already right")).toBeInTheDocument();
    expect(screen.getByText("Not settled")).toBeInTheDocument();
  });

  it("puts the equivalence finding in the actionable group, not the unsettled one", async () => {
    renderApp(<VerdictsPage />);
    // Classification is 5-4-3 — level, but that is a result, and it is worth
    // the most money of anything on the page.
    const heading = await screen.findByText("Change these");
    const section = heading.closest("section")!;
    expect(within(section).getByText("Classification")).toBeInTheDocument();
  });

  it("keeps settled verdicts on the table when nothing is priced yet", async () => {
    seedStore((ws) => {
      ws.taskProfiles = ws.taskProfiles.map((p) => ({ ...p, currentModelId: "", runsPerMonth: 0 }));
    });
    renderApp(<VerdictsPage />);
    const heading = await screen.findByText("Use these");
    const section = heading.closest("section")!;
    expect(within(section).getByText("Code review")).toBeInTheDocument();
    expect(within(section).getByText("Classification")).toBeInTheDocument();
    expect(screen.queryByText("Change these")).not.toBeInTheDocument();
  });

  it("expands a row to the duels behind it", async () => {
    const { user } = renderApp(<VerdictsPage />);
    const row = await screen.findByRole("button", { name: /Code generation/ });
    await user.click(row);

    await waitFor(() => expect(screen.getAllByText("Standings").length).toBeGreaterThan(0));
    expect(screen.getAllByText(/judged$/).length).toBeGreaterThan(0);
  });

  it("states the chance of the record in plain language", async () => {
    renderApp(<VerdictsPage />);
    expect(
      await screen.findByText(/would come up by chance about \d+ times? in 100/),
    ).toBeInTheDocument();
  });

  it("marks a recommendation that costs more as a judgement call", async () => {
    renderApp(<VerdictsPage />);
    const heading = await screen.findByText("Your call");
    const section = heading.closest("section")!;
    expect(within(section).getByText(/extra \/ mo/)).toBeInTheDocument();
  });

  it("shows how much of the routing table is settled", async () => {
    const ws = currentWorkspace();
    const covered = evidenceCoverage(allVerdicts(ws.duels, ws.models, ws.taskProfiles, TASK_TYPES));
    renderApp(<VerdictsPage />);
    expect(
      await screen.findByText(new RegExp(`${covered.covered} of ${covered.total} task types settled`)),
    ).toBeInTheDocument();
  });

  it("counts the evidence behind the whole table", async () => {
    const ws = currentWorkspace();
    const decided = ws.duels.filter((d) => d.status === "decided").length;
    renderApp(<VerdictsPage />);
    expect(await screen.findByText(String(decided))).toBeInTheDocument();
  });
});
