import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { StackInsight } from "./stack-insight";
import { renderApp } from "@/test/utils";
import type { Tool } from "@/lib/data/types";

const tool = (partial: Partial<Tool>): Tool => ({
  id: Math.random().toString(36).slice(2),
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
  addedAt: new Date().toISOString(),
  lastUsedAt: new Date().toISOString(),
  usage30d: 90,
  renewsOn: null,
  ...partial,
});

describe("stack insight", () => {
  it("stays hidden when nothing needs a decision", () => {
    const { container } = renderApp(
      <StackInsight tools={[tool({ usage30d: 200 })]} onReview={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("totals the money tied up in barely-used subscriptions", () => {
    renderApp(
      <StackInsight
        tools={[
          tool({ name: "Copilot", monthlyCost: 10, usage30d: 4 }),
          tool({ name: "Notion AI", monthlyCost: 8, usage30d: 2 }),
          tool({ name: "Cursor", monthlyCost: 20, usage30d: 200 }),
        ]}
        onReview={() => {}}
      />,
    );
    expect(screen.getByText(/\$18.00/)).toBeInTheDocument();
    expect(screen.getByText(/2 subscriptions you barely open/)).toBeInTheDocument();
    expect(screen.getByText(/\$216/)).toBeInTheDocument();
  });

  it("names the worst offender by cost per use", () => {
    renderApp(
      <StackInsight
        tools={[
          tool({ name: "Cheap", monthlyCost: 5, usage30d: 10 }),
          tool({ name: "Expensive", monthlyCost: 30, usage30d: 2 }),
        ]}
        onReview={() => {}}
      />,
    );
    expect(screen.getByText(/Expensive costs/)).toBeInTheDocument();
    expect(screen.getByText(/\$15.00/)).toBeInTheDocument();
  });

  it("uses singular wording for a single trial", () => {
    renderApp(
      <StackInsight
        tools={[
          tool({ name: "Idle", monthlyCost: 10, usage30d: 1 }),
          tool({ name: "Gemini", status: "trial", monthlyCost: 19.99 }),
        ]}
        onReview={() => {}}
      />,
    );
    expect(screen.getByText(/One trial also converts soon/)).toBeInTheDocument();
  });

  it("never counts a free tool as money at risk", () => {
    const { container } = renderApp(
      <StackInsight tools={[tool({ monthlyCost: 0, usage30d: 0 })]} onReview={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("hands the review action back to the page", async () => {
    let called = false;
    const { user } = renderApp(
      <StackInsight
        tools={[tool({ monthlyCost: 12, usage30d: 3 })]}
        onReview={() => {
          called = true;
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /review them/i }));
    expect(called).toBe(true);
  });
});
