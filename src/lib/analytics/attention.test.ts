import { describe, expect, it } from "vitest";
import { dashboardSummary, deriveAttention } from "./attention";
import { createSeedWorkspace } from "../data/seed";
import type { Workspace } from "../data/types";
import { addDays, toDayKey } from "../utils/date";

const NOW = new Date(2026, 4, 20, 9, 0, 0);

function base(): Workspace {
  const workspace = createSeedWorkspace(NOW);
  // Start from a quiet workspace so each test asserts the signal it creates.
  workspace.tools = [];
  workspace.projects = [];
  workspace.spend = [];
  return workspace;
}

const day = (offset: number) => toDayKey(addDays(NOW, offset));

const tool = (partial: Partial<Workspace["tools"][number]>): Workspace["tools"][number] => ({
  id: "t1",
  name: "Tool",
  provider: "other",
  category: "assistant",
  description: "",
  status: "active",
  monthlyCost: 20,
  billingCycle: "monthly",
  seats: 1,
  primaryModelId: null,
  url: "#",
  notes: "",
  favorite: false,
  tags: [],
  addedAt: NOW.toISOString(),
  lastUsedAt: NOW.toISOString(),
  usage30d: 40,
  renewsOn: null,
  ...partial,
});

describe("deriveAttention — trials", () => {
  it("flags a trial ending soon, with the price it converts to", () => {
    const workspace = base();
    workspace.tools = [tool({ status: "trial", renewsOn: day(2), monthlyCost: 19.99 })];
    const item = deriveAttention(workspace, NOW).find((i) => i.id.startsWith("trial-"))!;
    expect(item).toBeDefined();
    expect(item.severity).toBe("critical");
    expect(item.detail).toContain("$19.99");
  });

  it("softens the severity as the deadline recedes", () => {
    const workspace = base();
    workspace.tools = [tool({ status: "trial", renewsOn: day(15) })];
    expect(deriveAttention(workspace, NOW)[0]!.severity).toBe("info");
  });

  it("ignores a trial that is still weeks away", () => {
    const workspace = base();
    workspace.tools = [tool({ status: "trial", renewsOn: day(45) })];
    expect(deriveAttention(workspace, NOW)).toHaveLength(0);
  });
});

describe("deriveAttention — idle subscriptions", () => {
  it("flags a paid tool that is barely used", () => {
    const workspace = base();
    workspace.tools = [tool({ usage30d: 3, monthlyCost: 30 })];
    const item = deriveAttention(workspace, NOW).find((i) => i.id.startsWith("idle-"))!;
    expect(item.severity).toBe("warning");
    expect(item.detail).toContain("3 sessions");
  });

  it("flags a well-used tool that has not been opened in weeks", () => {
    const workspace = base();
    workspace.tools = [tool({ usage30d: 40, lastUsedAt: addDays(NOW, -40).toISOString() })];
    expect(deriveAttention(workspace, NOW).some((i) => i.id.startsWith("idle-"))).toBe(true);
  });

  it("leaves an actively used tool alone", () => {
    const workspace = base();
    workspace.tools = [tool({ usage30d: 90, lastUsedAt: NOW.toISOString() })];
    expect(deriveAttention(workspace, NOW).some((i) => i.id.startsWith("idle-"))).toBe(false);
  });

  it("never flags a free tool as wasted money", () => {
    const workspace = base();
    workspace.tools = [tool({ monthlyCost: 0, usage30d: 0 })];
    expect(deriveAttention(workspace, NOW).some((i) => i.id.startsWith("idle-"))).toBe(false);
  });
});

describe("deriveAttention — renewals", () => {
  it("mentions an imminent renewal", () => {
    const workspace = base();
    workspace.tools = [tool({ renewsOn: day(2), usage30d: 90 })];
    const item = deriveAttention(workspace, NOW).find((i) => i.id.startsWith("renew-"))!;
    expect(item.title).toContain("2 days");
  });

  it("says today on the day itself", () => {
    const workspace = base();
    workspace.tools = [tool({ renewsOn: day(0), usage30d: 90 })];
    expect(deriveAttention(workspace, NOW)[0]!.title).toContain("today");
  });

  it("stays quiet about a renewal a fortnight out", () => {
    const workspace = base();
    workspace.tools = [tool({ renewsOn: day(14), usage30d: 90 })];
    expect(deriveAttention(workspace, NOW)).toHaveLength(0);
  });
});

describe("deriveAttention — budgets", () => {
  it("warns once a project passes 80% of its budget", () => {
    const workspace = base();
    workspace.projects = [
      { ...createSeedWorkspace(NOW).projects[0]!, id: "p1", name: "Atlas", budget: 100 },
    ];
    workspace.spend = [
      {
        id: "s1",
        date: day(-2),
        provider: "anthropic",
        toolId: null,
        projectId: "p1",
        modelId: null,
        category: "api",
        kind: "usage",
        amount: 85,
        description: "",
        tokensIn: null,
        tokensOut: null,
      },
    ];
    const item = deriveAttention(workspace, NOW).find((i) => i.id === "project-budget-p1")!;
    expect(item.severity).toBe("warning");
    expect(item.title).toContain("85%");
  });

  it("escalates to critical once the project is over", () => {
    const workspace = base();
    workspace.projects = [
      { ...createSeedWorkspace(NOW).projects[0]!, id: "p1", name: "Atlas", budget: 100 },
    ];
    workspace.spend = [
      {
        id: "s1",
        date: day(-1),
        provider: "anthropic",
        toolId: null,
        projectId: "p1",
        modelId: null,
        category: "api",
        kind: "usage",
        amount: 140,
        description: "",
        tokensIn: null,
        tokensOut: null,
      },
    ];
    expect(deriveAttention(workspace, NOW)[0]!.severity).toBe("critical");
  });

  it("ignores a project with no budget set", () => {
    const workspace = base();
    workspace.projects = [
      { ...createSeedWorkspace(NOW).projects[0]!, id: "p1", budget: null },
    ];
    expect(deriveAttention(workspace, NOW).some((i) => i.id.startsWith("project-budget"))).toBe(false);
  });
});

describe("deriveAttention — tasks", () => {
  it("marks an overdue task critical and names the project", () => {
    const workspace = base();
    const seed = createSeedWorkspace(NOW).projects[0]!;
    workspace.projects = [
      {
        ...seed,
        id: "p1",
        name: "Atlas",
        status: "active",
        budget: null,
        tasks: [{ id: "t1", title: "Ship it", done: false, dueDate: day(-3) }],
      },
    ];
    const item = deriveAttention(workspace, NOW).find((i) => i.id === "task-t1")!;
    expect(item.severity).toBe("critical");
    expect(item.detail).toContain("Atlas");
    expect(item.detail).toContain("3 days overdue");
  });

  it("ignores completed tasks and shipped projects", () => {
    const workspace = base();
    const seed = createSeedWorkspace(NOW).projects[0]!;
    workspace.projects = [
      {
        ...seed,
        id: "p1",
        status: "shipped",
        budget: null,
        tasks: [{ id: "t1", title: "Old", done: false, dueDate: day(-9) }],
      },
      {
        ...seed,
        id: "p2",
        status: "active",
        budget: null,
        tasks: [{ id: "t2", title: "Done", done: true, dueDate: day(-9) }],
      },
    ];
    expect(deriveAttention(workspace, NOW)).toHaveLength(0);
  });
});

describe("deriveAttention — ordering", () => {
  it("sorts critical items ahead of warnings and info", () => {
    const workspace = base();
    workspace.tools = [
      tool({ id: "t1", name: "Ending", status: "trial", renewsOn: day(1) }),
      tool({ id: "t2", name: "Idle", usage30d: 1 }),
      tool({ id: "t3", name: "Renewing", renewsOn: day(3), usage30d: 90 }),
    ];
    const severities = deriveAttention(workspace, NOW).map((i) => i.severity);
    expect(severities[0]).toBe("critical");
    expect(severities[severities.length - 1]).toBe("info");
  });

  it("gives every item a link to act on", () => {
    const workspace = createSeedWorkspace(NOW);
    const items = deriveAttention(workspace, NOW);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.href.startsWith("/"))).toBe(true);
  });
});

describe("dashboardSummary", () => {
  const workspace = createSeedWorkspace(NOW);

  it("counts only active tools in the fixed monthly total", () => {
    const summary = dashboardSummary(workspace, NOW);
    const expected = workspace.tools
      .filter((t) => t.status === "active" && t.billingCycle !== "usage")
      .reduce((sum, t) => sum + t.monthlyCost, 0);
    expect(summary.fixedMonthly).toBeCloseTo(expected, 2);
    expect(summary.activeToolCount).toBeLessThanOrEqual(summary.totalToolCount);
  });

  it("counts distinct models in active use, not total models", () => {
    const summary = dashboardSummary(workspace, NOW);
    expect(summary.modelsInUse).toBeGreaterThan(0);
    expect(summary.modelsInUse).toBeLessThanOrEqual(workspace.models.length);
  });

  it("counts prompt runs from the last 30 days only", () => {
    const summary = dashboardSummary(workspace, NOW);
    const cutoff = addDays(NOW, -30).toISOString();
    const expected = workspace.activity.filter(
      (e) => e.kind === "prompt.run" && e.at >= cutoff,
    ).length;
    expect(summary.promptRuns).toBe(expected);
  });
});
