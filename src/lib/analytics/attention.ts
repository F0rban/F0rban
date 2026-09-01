import type { Workspace } from "../data/types";
import { budgetStatus, monthToDate, round } from "./spend";
import { daysBetween, monthKey, parseDay } from "../utils/date";
import { formatCurrency } from "../utils/format";

export type Severity = "critical" | "warning" | "info";

export interface AttentionItem {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  href: string;
  /** Sort key — lower surfaces first. */
  rank: number;
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 100, info: 200 };

/**
 * Derives everything the user should look at today from the workspace itself.
 *
 * This is the difference between a dashboard and a wall of charts: nothing here
 * is decorative, and every item is computed from real state — a trial with a
 * date on it, a subscription nobody opened, a project past its budget.
 */
export function deriveAttention(workspace: Workspace, now: Date = new Date()): AttentionItem[] {
  const items: AttentionItem[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  /* Budget ------------------------------------------------------------ */
  const budget = budgetStatus(workspace.spend, workspace.preferences.monthlyBudget, now);
  if (budget.state === "over") {
    const over = round(budget.forecast - budget.budget);
    items.push({
      id: "budget-forecast",
      severity: budget.spent > budget.budget ? "critical" : "warning",
      title:
        budget.spent > budget.budget
          ? `Over budget by ${formatCurrency(budget.spent - budget.budget)}`
          : `On track to exceed budget by ${formatCurrency(over)}`,
      detail:
        budget.daysLeft > 0
          ? `${formatCurrency(budget.spent)} spent with ${budget.daysLeft} days left. Staying under means ${formatCurrency(budget.safeDailyRate)}/day from here.`
          : `${formatCurrency(budget.spent)} against a ${formatCurrency(budget.budget)} ceiling.`,
      href: "/spending",
      rank: SEVERITY_RANK[budget.spent > budget.budget ? "critical" : "warning"],
    });
  }

  /* Trials ------------------------------------------------------------ */
  for (const tool of workspace.tools) {
    if (tool.status !== "trial" || !tool.renewsOn) continue;
    const days = daysBetween(today, parseDay(tool.renewsOn));
    if (days > 21) continue;
    items.push({
      id: `trial-${tool.id}`,
      severity: days <= 3 ? "critical" : days <= 10 ? "warning" : "info",
      title:
        days <= 0
          ? `${tool.name} trial has ended`
          : `${tool.name} trial ends in ${days} day${days === 1 ? "" : "s"}`,
      detail: `Converts to ${formatCurrency(tool.monthlyCost)}/month. Used ${tool.usage30d} times in the last 30 days.`,
      href: `/tools?tool=${tool.id}`,
      rank: SEVERITY_RANK[days <= 3 ? "critical" : days <= 10 ? "warning" : "info"] + days,
    });
  }

  /* Paid but idle ----------------------------------------------------- */
  for (const tool of workspace.tools) {
    if (tool.status !== "active" || tool.monthlyCost <= 0) continue;
    const idleDays = tool.lastUsedAt ? daysBetween(new Date(tool.lastUsedAt), now) : 999;
    // "Actively used" means roughly every other day and opened recently.
    if (tool.usage30d >= 12 && idleDays < 21) continue;
    items.push({
      id: `idle-${tool.id}`,
      severity: "warning",
      title: `${tool.name} is barely used`,
      detail: `${formatCurrency(tool.monthlyCost)}/month, ${tool.usage30d} session${tool.usage30d === 1 ? "" : "s"} in 30 days. Last opened ${idleDays > 365 ? "over a year ago" : `${idleDays} days ago`}.`,
      href: `/tools?tool=${tool.id}`,
      rank: SEVERITY_RANK.warning + 40 - Math.min(39, tool.monthlyCost),
    });
  }

  /* Renewals ---------------------------------------------------------- */
  for (const tool of workspace.tools) {
    if (tool.status !== "active" || !tool.renewsOn || tool.monthlyCost <= 0) continue;
    const days = daysBetween(today, parseDay(tool.renewsOn));
    if (days < 0 || days > 5) continue;
    items.push({
      id: `renew-${tool.id}`,
      severity: "info",
      title:
        days === 0
          ? `${tool.name} renews today`
          : `${tool.name} renews in ${days} day${days === 1 ? "" : "s"}`,
      detail: `${formatCurrency(tool.monthlyCost)} will be charged.`,
      href: `/tools?tool=${tool.id}`,
      rank: SEVERITY_RANK.info + days,
    });
  }

  /* Project budgets --------------------------------------------------- */
  const thisMonth = monthKey(now);
  for (const project of workspace.projects) {
    if (!project.budget || project.status === "archived") continue;
    const spent = round(
      workspace.spend
        .filter((e) => e.projectId === project.id && e.date.slice(0, 7) === thisMonth)
        .reduce((sum, e) => sum + e.amount, 0),
    );
    const pct = (spent / project.budget) * 100;
    if (pct < 80) continue;
    items.push({
      id: `project-budget-${project.id}`,
      severity: pct >= 100 ? "critical" : "warning",
      title:
        pct >= 100
          ? `${project.name} is over budget`
          : `${project.name} is at ${Math.round(pct)}% of budget`,
      detail: `${formatCurrency(spent)} of ${formatCurrency(project.budget)} this month.`,
      href: `/projects/${project.id}`,
      rank: SEVERITY_RANK[pct >= 100 ? "critical" : "warning"] + 10,
    });
  }

  /* Tasks ------------------------------------------------------------- */
  for (const project of workspace.projects) {
    if (project.status === "archived" || project.status === "shipped") continue;
    for (const task of project.tasks) {
      if (task.done || !task.dueDate) continue;
      const days = daysBetween(today, parseDay(task.dueDate));
      if (days > 4) continue;
      items.push({
        id: `task-${task.id}`,
        severity: days < 0 ? "critical" : days <= 1 ? "warning" : "info",
        title: task.title,
        detail:
          days < 0
            ? `${project.name} · ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`
            : days === 0
              ? `${project.name} · due today`
              : `${project.name} · due in ${days} day${days === 1 ? "" : "s"}`,
        href: `/projects/${project.id}`,
        rank: SEVERITY_RANK[days < 0 ? "critical" : days <= 1 ? "warning" : "info"] + 20 + days,
      });
    }
  }

  return items.sort((a, b) => a.rank - b.rank);
}

/** Headline counters for the dashboard tiles. */
export function dashboardSummary(workspace: Workspace, now: Date = new Date()) {
  const activeTools = workspace.tools.filter((t) => t.status === "active");
  const fixedMonthly = round(
    activeTools.filter((t) => t.billingCycle !== "usage").reduce((sum, t) => sum + t.monthlyCost, 0),
  );

  const thisMonth = monthKey(now);
  const usageThisMonth = round(
    workspace.spend
      .filter((e) => e.date.slice(0, 7) === thisMonth && e.kind === "usage")
      .reduce((sum, e) => sum + e.amount, 0),
  );

  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const promptRuns = workspace.activity.filter(
    (event) => event.kind === "prompt.run" && event.at >= cutoff,
  ).length;

  const modelsInUse = new Set(
    [
      ...workspace.tools.filter((t) => t.status === "active").map((t) => t.primaryModelId),
      ...workspace.projects.filter((p) => p.status === "active").flatMap((p) => p.modelIds),
      ...workspace.workflows.flatMap((w) => w.nodes.map((n) => n.modelId)),
    ].filter((id): id is string => Boolean(id)),
  ).size;

  return {
    monthToDate: monthToDate(workspace.spend, now),
    fixedMonthly,
    usageThisMonth,
    activeToolCount: activeTools.length,
    totalToolCount: workspace.tools.length,
    modelsInUse,
    promptRuns,
    activeProjects: workspace.projects.filter((p) => p.status === "active").length,
  };
}
