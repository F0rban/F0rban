import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { PromptComposer } from "./prompt-composer";
import { currentWorkspace, renderApp, seedStore, stubClipboard } from "@/test/utils";
import { resetRouter } from "@/test/next-navigation";
import { useUiStore } from "@/lib/store/ui";
import type { Prompt } from "@/lib/data/types";

function promptFixture(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: "p-test",
    title: "Rewrite",
    description: "",
    body: "Rewrite for {{audience}} in a {{tone}} tone.\n\n{{draft}}",
    category: "writing",
    tags: [],
    variables: [
      {
        name: "audience",
        label: "Audience",
        description: "Who reads this",
        type: "text",
        defaultValue: "A senior engineer",
      },
      {
        name: "tone",
        label: "Tone",
        description: "",
        type: "select",
        defaultValue: "Direct",
        options: ["Direct", "Warm"],
      },
      { name: "draft", label: "Draft", description: "", type: "longtext", defaultValue: "" },
    ],
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: null,
    useCount: 3,
    modelIds: [],
    versions: [],
    ...overrides,
  };
}

beforeEach(() => {
  resetRouter();
  seedStore((workspace) => {
    workspace.prompts = [promptFixture()];
  });
});

describe("prompt composer", () => {
  it("renders one control per variable, seeded with its default", () => {
    renderApp(<PromptComposer prompt={promptFixture()} />);
    expect(screen.getByLabelText("Audience")).toHaveValue("A senior engineer");
    expect(screen.getByLabelText("Tone")).toHaveValue("Direct");
    expect(screen.getByLabelText("Draft")).toHaveValue("");
  });

  it("substitutes a value into the preview as it is typed", async () => {
    const { user } = renderApp(<PromptComposer prompt={promptFixture()} />);
    const field = screen.getByLabelText("Audience");
    await user.clear(field);
    await user.type(field, "A CFO");
    expect(await screen.findByText("A CFO")).toBeInTheDocument();
  });

  it("leaves an unfilled placeholder visible in the preview", () => {
    renderApp(<PromptComposer prompt={promptFixture()} />);
    expect(screen.getByTitle("{{draft}} is not filled in")).toHaveTextContent("{{draft}}");
  });

  it("reports how many variables are filled", () => {
    renderApp(<PromptComposer prompt={promptFixture()} />);
    expect(screen.getByText("2/3 filled")).toBeInTheDocument();
  });

  it("updates the filled count when a field is completed", async () => {
    const { user } = renderApp(<PromptComposer prompt={promptFixture()} />);
    await user.type(screen.getByLabelText("Draft"), "Some text");
    expect(await screen.findByText("3/3 filled")).toBeInTheDocument();
  });

  it("copies the rendered prompt, with values substituted", async () => {
    const { user } = renderApp(<PromptComposer prompt={promptFixture()} />);
    // userEvent.setup() installs its own clipboard stub, so ours goes after.
    const writeText = stubClipboard();
    await user.click(screen.getByRole("button", { name: /copy prompt/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const copied = writeText.mock.calls[0]![0] as string;
    expect(copied).toContain("A senior engineer");
    expect(copied).toContain("Direct");
    expect(copied).not.toContain("{{audience}}");
    // The unfilled one stays visible rather than becoming a silent blank.
    expect(copied).toContain("{{draft}}");
  });

  it("records a run so usage counts mean something", async () => {
    const { user } = renderApp(<PromptComposer prompt={promptFixture()} />);
    stubClipboard();
    await user.click(screen.getByRole("button", { name: /copy prompt/i }));

    await waitFor(() => {
      expect(currentWorkspace().prompts[0]!.useCount).toBe(4);
    });
    expect(currentWorkspace().prompts[0]!.lastUsedAt).not.toBeNull();
    expect(currentWorkspace().activity[0]!.kind).toBe("prompt.run");
  });

  it("warns in the toast when variables are still empty", async () => {
    const { user } = renderApp(<PromptComposer prompt={promptFixture()} />);
    stubClipboard();
    await user.click(screen.getByRole("button", { name: /copy prompt/i }));
    await waitFor(() => expect(useUiStore.getState().toasts).toHaveLength(1));
    expect(useUiStore.getState().toasts[0]!.tone).toBe("warning");
  });

  it("confirms success once nothing is left empty", async () => {
    const { user } = renderApp(<PromptComposer prompt={promptFixture()} />);
    stubClipboard();
    await user.type(screen.getByLabelText("Draft"), "Body");
    await user.click(screen.getByRole("button", { name: /copy prompt/i }));
    await waitFor(() => expect(useUiStore.getState().toasts).toHaveLength(1));
    expect(useUiStore.getState().toasts[0]!.tone).toBe("success");
  });

  it("shows a copied confirmation on the button", async () => {
    const { user } = renderApp(<PromptComposer prompt={promptFixture()} />);
    stubClipboard();
    await user.click(screen.getByRole("button", { name: /copy prompt/i }));
    expect(await screen.findByRole("button", { name: /copied/i })).toBeInTheDocument();
  });

  it("clears every field, then restores the defaults", async () => {
    const { user } = renderApp(<PromptComposer prompt={promptFixture()} />);
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.getByLabelText("Audience")).toHaveValue("");
    expect(await screen.findByText("0/3 filled")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.getByLabelText("Audience")).toHaveValue("A senior engineer");
  });

  it("explains itself for a prompt with no variables", () => {
    renderApp(<PromptComposer prompt={promptFixture({ variables: [], body: "Static text" })} />);
    expect(screen.getByText("No variables")).toBeInTheDocument();
  });
});
