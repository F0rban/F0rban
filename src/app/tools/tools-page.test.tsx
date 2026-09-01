import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import ToolsPage from "./page";
import { currentWorkspace, renderApp, seedStore } from "@/test/utils";
import { resetRouter, setRoute } from "@/test/next-navigation";

beforeEach(() => {
  resetRouter();
  setRoute("/tools");
  seedStore();
});

const grid = () => screen.getAllByRole("button", { name: /^Open / });

describe("tools page", () => {
  it("lists every tool in the workspace", async () => {
    renderApp(<ToolsPage />);
    await waitFor(() => expect(grid().length).toBe(currentWorkspace().tools.length));
  });

  it("summarises fixed monthly cost from active tools only", async () => {
    renderApp(<ToolsPage />);
    const expected = currentWorkspace()
      .tools.filter((t) => t.status === "active")
      .reduce((sum, t) => sum + t.monthlyCost, 0);
    expect(await screen.findByText(`$${Math.round(expected)}`)).toBeInTheDocument();
  });

  it("filters to records that mention the term, ranking the name match first", async () => {
    const { user } = renderApp(<ToolsPage />);
    const all = (await screen.findAllByRole("button", { name: /^Open / })).length;
    await user.type(screen.getByRole("searchbox", { name: /search tools/i }), "cursor");

    // Copilot and v0 both mention Cursor in their notes, so they stay — but
    // the tool actually called Cursor leads.
    await waitFor(() => expect(grid().length).toBeLessThan(all));
    expect(grid()[0]).toHaveAccessibleName("Open Cursor");
  });

  it("excludes records that merely share letters with the query", async () => {
    const { user } = renderApp(<ToolsPage />);
    await screen.findAllByRole("button", { name: /^Open / });
    await user.type(screen.getByRole("searchbox", { name: /search tools/i }), "midjourney");
    await waitFor(() => expect(grid()).toHaveLength(1));
    expect(grid()[0]).toHaveAccessibleName("Open Midjourney");
  });

  it("searches notes and tags, not just names", async () => {
    const { user } = renderApp(<ToolsPage />);
    await screen.findAllByRole("button", { name: /^Open / });
    await user.type(screen.getByRole("searchbox", { name: /search tools/i }), "moodboard");
    await waitFor(() => expect(grid()).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Open Midjourney" })).toBeInTheDocument();
  });

  it("shows an empty state, with a reset, when nothing matches", async () => {
    const { user } = renderApp(<ToolsPage />);
    const search = screen.getByRole("searchbox", { name: /search tools/i });
    await user.type(search, "zzzzqqq");
    expect(await screen.findByText("No tools match those filters")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reset filters/i }));
    await waitFor(() => expect(grid().length).toBeGreaterThan(1));
  });

  it("narrows to starred tools and back", async () => {
    const { user } = renderApp(<ToolsPage />);
    await screen.findAllByRole("button", { name: /^Open / });
    const starred = currentWorkspace().tools.filter((t) => t.favorite).length;

    await user.click(screen.getByRole("button", { name: /^Starred$/ }));
    await waitFor(() => expect(grid()).toHaveLength(starred));

    await user.click(screen.getByRole("button", { name: /^Starred$/ }));
    await waitFor(() => expect(grid().length).toBeGreaterThan(starred));
  });

  it("filters by status through the dropdown", async () => {
    const { user } = renderApp(<ToolsPage />);
    await screen.findAllByRole("button", { name: /^Open / });

    await user.click(screen.getByRole("button", { name: /^Status/ }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /Trial/ }));
    // The menu stays open for multi-select, and while it is open Radix hides
    // the rest of the page from the accessibility tree.
    await user.keyboard("{Escape}");

    const trials = currentWorkspace().tools.filter((t) => t.status === "trial").length;
    await waitFor(() => expect(grid()).toHaveLength(trials));
  });

  it("toggles a favourite from the card and persists it", async () => {
    const { user } = renderApp(<ToolsPage />);
    await screen.findAllByRole("button", { name: /^Open / });

    const before = currentWorkspace().tools.find((t) => t.name === "Runway")!.favorite;
    await user.click(screen.getByRole("button", { name: /^(Star|Unstar) Runway$/ }));

    await waitFor(() => {
      expect(currentWorkspace().tools.find((t) => t.name === "Runway")!.favorite).toBe(!before);
    });
  });

  it("switches to the table view", async () => {
    const { user } = renderApp(<ToolsPage />);
    await screen.findAllByRole("button", { name: /^Open / });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Table view" }));
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Cursor")).toBeInTheDocument();
  });

  it("opens a tool's detail dialog with its stats", async () => {
    const { user } = renderApp(<ToolsPage />);
    await user.click(await screen.findByRole("button", { name: "Open Perplexity" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Perplexity" })).toBeInTheDocument();
    expect(within(dialog).getByText("Cost per use")).toBeInTheDocument();
  });

  it("zeroes the monthly cost when a tool is cancelled, so the total stops counting it", async () => {
    const { user } = renderApp(<ToolsPage />);
    await user.click(await screen.findByRole("button", { name: "Open Perplexity" }));

    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText("Status"), "cancelled");

    await waitFor(() => {
      const tool = currentWorkspace().tools.find((t) => t.name === "Perplexity")!;
      expect(tool.status).toBe("cancelled");
      expect(tool.monthlyCost).toBe(0);
    });
  });

  it("saves personal notes from the detail dialog", async () => {
    const { user } = renderApp(<ToolsPage />);
    await user.click(await screen.findByRole("button", { name: "Open Perplexity" }));

    const dialog = await screen.findByRole("dialog");
    const notes = within(dialog).getByLabelText(/Personal notes/);
    await user.clear(notes);
    await user.type(notes, "Cancel after the research project ships.");
    await user.click(within(dialog).getByRole("button", { name: /save notes/i }));

    await waitFor(() => {
      expect(currentWorkspace().tools.find((t) => t.name === "Perplexity")!.notes).toBe(
        "Cancel after the research project ships.",
      );
    });
  });

  it("deletes a tool from the detail dialog", async () => {
    const { user } = renderApp(<ToolsPage />);
    const before = currentWorkspace().tools.length;
    await user.click(await screen.findByRole("button", { name: "Open Gemini" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /remove/i }));

    await waitFor(() => expect(currentWorkspace().tools).toHaveLength(before - 1));
    expect(currentWorkspace().tools.some((t) => t.name === "Gemini")).toBe(false);
  });

  it("opens straight onto a tool when the URL names one", async () => {
    setRoute("/tools", { tool: "t-cursor" });
    renderApp(<ToolsPage />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Cursor" })).toBeInTheDocument();
  });
});
