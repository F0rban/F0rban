import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import TodayPage from "./page";
import { currentWorkspace, renderApp, seedStore } from "@/test/utils";
import { resetRouter, setRoute } from "@/test/next-navigation";

beforeEach(() => {
  resetRouter();
  setRoute("/");
});

describe("Today", () => {
  it("calls the worked example what it is", async () => {
    seedStore();
    renderApp(<TodayPage />);
    expect(await screen.findByText(/worked example, the record says/)).toBeInTheDocument();
    expect(screen.queryByText(/Your own results/)).not.toBeInTheDocument();
  });

  it("says 'your' only once the record is the user's", async () => {
    seedStore((ws) => {
      ws.preferences.usingSampleData = false;
      ws.duels = ws.duels.map((d) => ({ ...d, sample: false }));
    });
    renderApp(<TodayPage />);
    expect(await screen.findByText(/Your own results say/)).toBeInTheDocument();
  });

  it("never claims a saving when the record has not started", async () => {
    seedStore((ws) => {
      ws.preferences.usingSampleData = false;
      ws.duels = [];
    });
    renderApp(<TodayPage />);
    expect(await screen.findByText("No verdicts yet.")).toBeInTheDocument();
    expect(screen.queryByText(/overpaying/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$0\b/)).not.toBeInTheDocument();
  });

  it("puts the open duels and the one action first", async () => {
    seedStore();
    renderApp(<TodayPage />);
    await screen.findByText("Waiting for a verdict");
    const pending = currentWorkspace().duels.filter((d) => d.status === "pending").length;
    expect(screen.getAllByRole("link", { name: /judge$/i })).toHaveLength(Math.min(pending, 3));
    expect(screen.getByRole("link", { name: /^run a duel$/i })).toHaveAttribute("href", "/duels/new");
  });

  it("carries neither an activity feed nor a spend meter", async () => {
    seedStore();
    renderApp(<TodayPage />);
    await screen.findByText("Waiting for a verdict");
    expect(screen.queryByText("Activity")).not.toBeInTheDocument();
    expect(screen.queryByText(/Spend this month/)).not.toBeInTheDocument();
    expect(screen.queryByText("Latest verdicts")).not.toBeInTheDocument();
  });

  it("points at the kinds of work closest to a verdict", async () => {
    seedStore();
    renderApp(<TodayPage />);
    expect(await screen.findByText(/Closest to a verdict/)).toBeInTheDocument();
    // Each one is a way to run exactly that duel.
    const links = screen.getAllByRole("link", { name: /(Code generation|Brainstorming|Research synthesis|Data extraction|Summarisation)\s*\d+$/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", expect.stringContaining("/duels/new?task="));
  });
});
