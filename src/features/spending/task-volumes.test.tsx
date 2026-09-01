import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { TaskVolumes } from "./task-volumes";
import { currentWorkspace, renderApp, seedStore } from "@/test/utils";
import { resetRouter } from "@/test/next-navigation";
import { allVerdicts, routingSummary } from "@/lib/analytics/verdicts";
import { TASK_TYPES } from "@/lib/data/seed/duels";

const saving = () => {
  const ws = currentWorkspace();
  return routingSummary(allVerdicts(ws.duels, ws.models, ws.taskProfiles, TASK_TYPES)).actionableSaving;
};

beforeEach(() => {
  resetRouter();
  seedStore();
});

describe("task volumes", () => {
  it("lists every kind of work the app keeps verdicts for", async () => {
    renderApp(<TaskVolumes />);
    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(TASK_TYPES.length + 1);
  });

  it("edits a volume and moves the saving with it", async () => {
    renderApp(<TaskVolumes />);
    const before = saving();

    const field = await screen.findByLabelText("Runs per month for Classification");
    fireEvent.change(field, { target: { value: "24000" } });

    await waitFor(() => {
      expect(
        currentWorkspace().taskProfiles.find((p) => p.taskType === "classification")!.runsPerMonth,
      ).toBe(24000);
    });
    // Doubling the highest-volume task roughly doubles what it contributes.
    expect(saving()).toBeGreaterThan(before);
  });

  it("changes what a task type is routed to today", async () => {
    renderApp(<TaskVolumes />);
    const select = await screen.findByLabelText("Model used for Code review");
    fireEvent.change(select, { target: { value: "m-claude-sonnet-45" } });

    await waitFor(() => {
      expect(
        currentWorkspace().taskProfiles.find((p) => p.taskType === "code-review")!.currentModelId,
      ).toBe("m-claude-sonnet-45");
    });
    // Now already on the recommended model, so it stops counting as a saving.
    const verdict = allVerdicts(
      currentWorkspace().duels,
      currentWorkspace().models,
      currentWorkspace().taskProfiles,
      TASK_TYPES,
    ).find((v) => v.taskType === "code-review")!;
    expect(verdict.monthlyDelta).toBe(0);
  });

  it("refuses a negative volume", async () => {
    renderApp(<TaskVolumes />);
    const field = await screen.findByLabelText("Runs per month for Brainstorming");
    fireEvent.change(field, { target: { value: "-500" } });

    await waitFor(() => {
      expect(
        currentWorkspace().taskProfiles.find((p) => p.taskType === "brainstorming")!.runsPerMonth,
      ).toBe(0);
    });
  });

  it("totals what the current routing costs", async () => {
    renderApp(<TaskVolumes />);
    expect(await screen.findByText(/\/ mo at current routing/)).toBeInTheDocument();
  });
});
