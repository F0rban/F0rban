import { beforeEach, describe, expect, it } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import { CommandPalette } from "./command-palette";
import { push, resetRouter } from "@/test/next-navigation";
import { renderApp, seedStore } from "@/test/utils";
import { useUiStore } from "@/lib/store/ui";

async function openPalette() {
  const result = renderApp(<CommandPalette />);
  useUiStore.setState({ paletteOpen: true });
  const input = await screen.findByRole("combobox");
  return { ...result, input };
}

beforeEach(() => {
  resetRouter();
  seedStore();
});

describe("command palette", () => {
  it("renders nothing until it is opened", () => {
    renderApp(<CommandPalette />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("opens with recent, starred and action groups", async () => {
    await openPalette();
    expect(await screen.findByText("Recent")).toBeInTheDocument();
    expect(screen.getByText("Starred")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("finds a model by name and groups it under Models", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "opus");

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("Models")).toBeInTheDocument();
    expect(within(listbox).getAllByRole("option")[0]).toHaveTextContent("Opus");
  });

  it("highlights the matched characters rather than only ranking", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "sonnet");
    const marks = await screen.findAllByText("Sonnet");
    expect(marks.some((node) => node.tagName === "MARK")).toBe(true);
  });

  it("searches prompt bodies, not just titles", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "hostile reviewer");
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("Adversarial code review")).toBeInTheDocument();
  });

  it("shows a result count once a query is typed", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "claude");
    expect(await screen.findByText(/results?$/)).toBeInTheDocument();
  });

  it("switches to commands only when the query starts with >", async () => {
    const { user, input } = await openPalette();
    await user.type(input, ">theme");

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("Appearance")).toBeInTheDocument();
    expect(within(listbox).queryByText("Models")).not.toBeInTheDocument();
  });

  it("moves the selection with the arrow keys", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "claude");

    const optionsBefore = await screen.findAllByRole("option");
    expect(optionsBefore[0]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");
    const optionsAfter = await screen.findAllByRole("option");
    expect(optionsAfter[0]).toHaveAttribute("aria-selected", "false");
    expect(optionsAfter[1]).toHaveAttribute("aria-selected", "true");
  });

  it("wraps the selection around the end of the list", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "midjourney");
    await user.keyboard("{ArrowUp}");
    const options = await screen.findAllByRole("option");
    expect(options[options.length - 1]).toHaveAttribute("aria-selected", "true");
  });

  it("navigates to the highlighted result on Enter and closes", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "opus");
    await waitFor(() => expect(screen.getAllByRole("option")[0]).toHaveTextContent("Opus"));
    await user.type(input, "{Enter}");

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push.mock.calls[0]![0]).toContain("/models?model=");
    expect(useUiStore.getState().paletteOpen).toBe(false);
  });

  it("runs a navigation command on Enter", async () => {
    const { user, input } = await openPalette();
    await user.type(input, ">go to verdicts");
    await waitFor(() => expect(screen.getAllByRole("option")[0]).toHaveTextContent("Verdicts"));
    // Target the field rather than whatever holds focus: a dialog closed by an
    // earlier test can still be restoring focus at this point.
    await user.type(input, "{Enter}");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/verdicts"));
  });

  it("activates a result on click", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "atlas");
    const option = (await screen.findAllByRole("option"))[0]!;
    await user.click(option);
    await waitFor(() => expect(push).toHaveBeenCalled());
  });

  it("explains itself when nothing matches", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "zzzzqqqq");
    expect(await screen.findByText(/No matches for/)).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("previews the highlighted model's pricing without navigating", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "claude haiku");
    const options = await screen.findAllByRole("option");
    expect(options[0]).toHaveTextContent("Haiku");

    const preview = screen.getByRole("complementary");
    expect(within(preview).getByText("Context")).toBeInTheDocument();
    expect(within(preview).getByText("Throughput")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("clears the query when reopened", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "opus");
    expect(input).toHaveValue("opus");

    await act(async () => {
      useUiStore.setState({ paletteOpen: false });
    });
    await act(async () => {
      useUiStore.setState({ paletteOpen: true });
    });

    await waitFor(async () => expect(await screen.findByRole("combobox")).toHaveValue(""));
  });
});
