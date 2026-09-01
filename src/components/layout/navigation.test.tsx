import { beforeEach, describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { Sidebar } from "./sidebar";
import { MobileTabBar } from "./mobile-nav";
import { renderApp, seedStore } from "@/test/utils";
import { resetRouter, setRoute } from "@/test/next-navigation";
import { useUiStore } from "@/lib/store/ui";
import { ALL_NAV_ITEMS, PRIMARY_NAV_ITEMS, findNavItem } from "@/lib/navigation";

beforeEach(() => {
  resetRouter();
  seedStore();
});

describe("findNavItem", () => {
  it("resolves Today for the root path", () => {
    expect(findNavItem("/")!.label).toBe("Today");
  });

  it("resolves a section from a nested route", () => {
    expect(findNavItem("/duels/d-abc")!.label).toBe("Duels");
  });

  it("does not let the root item swallow every other route", () => {
    expect(findNavItem("/spend")!.href).toBe("/spend");
  });

  it("returns undefined for an unknown route", () => {
    expect(findNavItem("/nope")).toBeUndefined();
  });
});

describe("sidebar", () => {
  it("renders every navigation destination once", () => {
    renderApp(<Sidebar />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    for (const item of ALL_NAV_ITEMS) {
      expect(within(nav).getByRole("link", { name: item.label })).toBeInTheDocument();
    }
  });

  it("marks the current page for assistive technology", () => {
    setRoute("/prompts");
    renderApp(<Sidebar />);
    expect(screen.getByRole("link", { name: "Prompts" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Models" })).not.toHaveAttribute("aria-current");
  });

  it("keeps a nested route's section marked as current", () => {
    setRoute("/duels/d-abc");
    renderApp(<Sidebar />);
    expect(screen.getByRole("link", { name: "Duels" })).toHaveAttribute("aria-current", "page");
  });

  it("opens the palette from the search affordance", async () => {
    const { user } = renderApp(<Sidebar />);
    await user.click(screen.getByRole("button", { name: /search/i }));
    expect(useUiStore.getState().paletteOpen).toBe(true);
  });

  it("collapses to a rail and back", async () => {
    const { user } = renderApp(<Sidebar />);
    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("carries no spend meter — that gauge belongs to Spend, not to every screen", () => {
    renderApp(<Sidebar />);
    expect(screen.queryByText("This month")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    // The one action in the chrome is the product's action.
    expect(screen.getByRole("button", { name: /run a duel|create/i })).toBeInTheDocument();
  });
});

describe("mobile tab bar", () => {
  it("carries only the primary destinations", () => {
    renderApp(<MobileTabBar />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getAllByRole("link")).toHaveLength(PRIMARY_NAV_ITEMS.length);
  });

  it("marks the current tab", () => {
    setRoute("/models");
    renderApp(<MobileTabBar />);
    expect(screen.getByRole("link", { name: "Models" })).toHaveAttribute("aria-current", "page");
  });
});

describe("top bar", () => {
  it("is a breadcrumb landmark, not a second page heading", async () => {
    setRoute("/spend");
    const { Topbar } = await import("./topbar");
    renderApp(<Topbar />);
    const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumb).getByText("Spend")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("shows the section and the record name on a detail route", async () => {
    setRoute("/duels/d-abc");
    useUiStore.setState({ pageTitle: "Billing service refund path" });
    const { Topbar } = await import("./topbar");
    renderApp(<Topbar />);
    const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumb).getByRole("link", { name: "Duels" })).toBeInTheDocument();
    expect(within(crumb).getByText("Billing service refund path")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
