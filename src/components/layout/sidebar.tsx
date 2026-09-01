"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Plus, Search } from "lucide-react";
import { NAVIGATION } from "@/lib/navigation";
import { useUiStore } from "@/lib/store/ui";
import { useWorkspace } from "@/hooks/use-workspace";
import { budgetStatus } from "@/lib/analytics/spend";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Logo, Wordmark } from "./logo";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { KbdGroup } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickCreate } from "./quick-create";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Live budget meter in the sidebar footer — the number you glance at most. */
function BudgetMeter({ collapsed }: { collapsed: boolean }) {
  const { workspace, ready } = useWorkspace();

  if (!ready || !workspace) {
    return collapsed ? null : <Skeleton className="h-11 w-full" />;
  }

  const status = budgetStatus(workspace.spend, workspace.preferences.monthlyBudget);
  const tone = status.state === "over" ? "negative" : status.state === "watch" ? "warning" : "accent";

  if (collapsed) {
    return (
      <Tooltip
        side="right"
        content={
          <span>
            {formatCurrency(status.spent)} of {formatCurrency(status.budget)} this month ·{" "}
            {status.usedPct}%
          </span>
        }
      >
        <Link
          href="/spending"
          aria-label={`Month-to-date spend ${formatCurrency(status.spent)}`}
          className="mx-auto block w-8"
        >
          <Progress
            value={status.spent}
            max={status.budget}
            tone={tone}
            size="sm"
            label="Month-to-date spend against budget"
          />
        </Link>
      </Tooltip>
    );
  }

  return (
    <Link
      href="/spending"
      className="block rounded-lg border border-line-subtle bg-surface-2/60 px-2.5 py-2 transition-colors hover:border-line hover:bg-surface-2"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-ink-4">
          This month
        </span>
        <span className="font-mono text-[11px] tabular-nums text-ink-3">{status.usedPct}%</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-[15px] font-semibold tabular-nums tracking-[-0.01em] text-ink">
          {formatCurrency(status.spent, { maximumFractionDigits: 0 })}
        </span>
        <span className="font-mono text-[10.5px] tabular-nums text-ink-4">
          / {formatCurrency(status.budget, { maximumFractionDigits: 0 })}
        </span>
      </div>
      <Progress
        className="mt-1.5"
        value={status.spent}
        max={status.budget}
        tone={tone}
        size="sm"
        label="Month-to-date spend against budget"
        marker={status.forecast}
        markerLabel={`Forecast ${formatCurrency(status.forecast)}`}
      />
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);

  return (
    <aside
      data-collapsed={collapsed || undefined}
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface-1/60 md:flex",
        "transition-[width] duration-250 ease-[var(--ease-out-quint)]",
        collapsed ? "w-[60px]" : "w-[228px]",
      )}
    >
      <div className={cn("flex h-14 shrink-0 items-center gap-2.5 px-3.5", collapsed && "justify-center px-0")}>
        <Link
          href="/"
          aria-label="AI Command Center — dashboard"
          className="flex min-w-0 items-center gap-2.5 text-accent"
        >
          <Logo />
          {!collapsed && <Wordmark />}
        </Link>
      </div>

      <div className={cn("px-2.5 pb-2", collapsed && "px-2")}>
        {collapsed ? (
          <Tooltip side="right" content="Search — ⌘K">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette"
              className="grid h-8 w-full place-items-center rounded-md border border-line bg-surface-2/60 text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
            >
              <Search className="size-3.5" />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className={cn(
              "group flex h-8 w-full items-center gap-2 rounded-md border border-line bg-surface-2/60 px-2",
              "text-left text-[12.5px] text-ink-4 transition-colors hover:border-line-strong hover:bg-surface-2",
            )}
          >
            <Search className="size-3.5 shrink-0 transition-colors group-hover:text-ink-3" />
            <span className="flex-1 truncate">Search…</span>
            <KbdGroup keys={["⌘", "K"]} />
          </button>
        )}
      </div>

      <nav aria-label="Main" className={cn("min-h-0 flex-1 overflow-y-auto px-2.5 pb-2", collapsed && "px-2")}>
        {NAVIGATION.map((group) => (
          <div key={group.label} className="mb-3.5">
            {!collapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4">
                {group.label}
              </p>
            )}
            {collapsed && <div className="mx-auto mb-2 h-px w-5 bg-line-subtle" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const link = (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md text-[12.5px] font-medium",
                      "transition-colors duration-150",
                      collapsed ? "h-8 justify-center" : "h-8 px-2",
                      active
                        ? "bg-surface-2 text-ink"
                        : "text-ink-3 hover:bg-surface-2/70 hover:text-ink-2",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-0 h-4 w-0.5 rounded-r-full bg-accent transition-opacity duration-200",
                        active ? "opacity-100" : "opacity-0",
                        collapsed && "-left-2",
                      )}
                    />
                    <item.icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-accent" : "text-ink-4 group-hover:text-ink-3",
                      )}
                      strokeWidth={active ? 2.1 : 1.9}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip side="right" content={item.label}>
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 space-y-2 border-t border-line-subtle p-2.5", collapsed && "px-2")}>
        <BudgetMeter collapsed={collapsed} />
        <div className={cn("flex items-center gap-1.5", collapsed && "flex-col")}>
          <QuickCreate collapsed={collapsed} />
          <Tooltip side={collapsed ? "right" : "top"} content={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="grid size-8 shrink-0 place-items-center rounded-md text-ink-4 transition-colors hover:bg-surface-2 hover:text-ink-2"
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}

export { Plus };
