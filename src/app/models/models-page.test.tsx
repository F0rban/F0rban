import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import ModelsPage from "./page";
import { currentWorkspace, renderApp, seedStore } from "@/test/utils";
import { resetRouter, setRoute } from "@/test/next-navigation";
import { MAX_COMPARE } from "@/features/models/model-meta";

beforeEach(() => {
  resetRouter();
  setRoute("/models");
  seedStore();
});

const compareBoxes = () => screen.getAllByRole("checkbox", { name: /^Compare / });
const selected = () => compareBoxes().filter((box) => box.getAttribute("aria-checked") === "true");

describe("model lab", () => {
  it("lists every model with a comparison checkbox", async () => {
    renderApp(<ModelsPage />);
    await waitFor(() =>
      expect(compareBoxes()).toHaveLength(currentWorkspace().models.length),
    );
  });

  it("opens with the starred models already being compared", async () => {
    renderApp(<ModelsPage />);
    await waitFor(() => expect(selected().length).toBeGreaterThanOrEqual(2));
    expect(screen.getByText("Capability profile")).toBeInTheDocument();
  });

  it("adds and removes a model from the comparison", async () => {
    const { user } = renderApp(<ModelsPage />);
    await screen.findAllByRole("checkbox", { name: /^Compare / });

    const box = screen.getByRole("checkbox", { name: "Compare Grok 4" });
    await user.click(box);
    await waitFor(() => expect(box).toHaveAttribute("aria-checked", "true"));

    await user.click(box);
    await waitFor(() => expect(box).toHaveAttribute("aria-checked", "false"));
  });

  it("caps the comparison at four, because a fifth radar is unreadable", async () => {
    const { user } = renderApp(<ModelsPage />);
    await screen.findAllByRole("checkbox", { name: /^Compare / });

    for (const box of compareBoxes()) {
      if (box.getAttribute("aria-checked") === "false") await user.click(box);
    }
    await waitFor(() => expect(selected()).toHaveLength(MAX_COMPARE));
    expect(screen.getByText(`${MAX_COMPARE}/${MAX_COMPARE} selected to compare`)).toBeInTheDocument();
  });

  it("clears the whole comparison and falls back to the empty state", async () => {
    const { user } = renderApp(<ModelsPage />);
    await screen.findByText("Capability profile");
    await user.click(screen.getByRole("button", { name: /clear all/i }));
    expect(await screen.findByText("Pick models to compare")).toBeInTheDocument();
  });

  it("highlights the best value in each spec row", async () => {
    renderApp(<ModelsPage />);
    const table = await screen.findByRole("table", { name: /specification/i });
    const inputRow = within(table).getByRole("row", { name: /^Input/ });
    const cells = within(inputRow).getAllByRole("cell");
    const cheapest = Math.min(
      ...cells.map((cell) => Number(cell.textContent!.replace("$", ""))),
    );
    const marked = cells.find((cell) => cell.querySelector(".bg-positive-soft"));
    expect(Number(marked!.textContent!.replace("$", ""))).toBe(cheapest);
  });

  it("prices the selected models for a chosen workload", async () => {
    const { user } = renderApp(<ModelsPage />);
    await screen.findByText("Workload cost");

    const tokensIn = screen.getByLabelText("Tokens in");
    await user.clear(tokensIn);
    await user.type(tokensIn, "100000");

    expect(await screen.findByText("cheapest")).toBeInTheDocument();
    expect(screen.getByText(/per month between the cheapest/)).toBeInTheDocument();
  });

  it("switches presets and updates the monthly call count", async () => {
    const { user } = renderApp(<ModelsPage />);
    await screen.findByText("Workload cost");
    expect(screen.getByText("3.6K calls/mo")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Classify" }));
    expect(await screen.findByText("150K calls/mo")).toBeInTheDocument();
  });

  it("filters to open-weights models", async () => {
    const { user } = renderApp(<ModelsPage />);
    await screen.findAllByRole("checkbox", { name: /^Compare / });
    await user.click(screen.getByRole("button", { name: /open weights/i }));

    const open = currentWorkspace().models.filter((m) => m.openWeights).length;
    await waitFor(() => expect(compareBoxes()).toHaveLength(open));
  });

  it("searches names and notes, leading with the name match", async () => {
    const { user } = renderApp(<ModelsPage />);
    const all = (await screen.findAllByRole("checkbox", { name: /^Compare / })).length;
    await user.type(screen.getByRole("searchbox", { name: /search models/i }), "haiku");

    // GPT-5.1 mini's note compares it to Haiku, so it stays — but the model
    // actually called Haiku leads.
    await waitFor(() => expect(compareBoxes().length).toBeLessThan(all));
    expect(compareBoxes()[0]).toHaveAccessibleName("Compare Claude Haiku 4.5");
  });

  it("excludes models that merely share letters with the query", async () => {
    const { user } = renderApp(<ModelsPage />);
    await screen.findAllByRole("checkbox", { name: /^Compare / });
    await user.type(screen.getByRole("searchbox", { name: /search models/i }), "mistral");
    await waitFor(() => expect(compareBoxes()).toHaveLength(1));
  });

  it("scores a model from its detail dialog", async () => {
    const { user } = renderApp(<ModelsPage />);
    const rows = await screen.findAllByRole("button", { name: /Grok 4/ });
    // The first is the row itself; the trailing one is the star toggle.
    await user.click(rows[0]!);

    const dialog = await screen.findByRole("dialog");
    // A range input is not editable text; drive it with a change event.
    const slider = within(dialog).getByLabelText("Your score");
    fireEvent.change(slider, { target: { value: "9" } });
    await user.click(within(dialog).getByRole("button", { name: /^Save$/ }));

    await waitFor(() => {
      expect(currentWorkspace().models.find((m) => m.name === "Grok 4")!.personalScore).toBe(9);
    });
  });

  it("opens straight onto a model when the URL names one", async () => {
    setRoute("/models", { model: "m-gemini-3-pro" });
    renderApp(<ModelsPage />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Gemini 3 Pro" })).toBeInTheDocument();
  });
});
