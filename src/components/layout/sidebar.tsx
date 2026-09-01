"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { NAVIGATION } from "@/lib/navigation";
import { useUiStore } from "@/lib/store/ui";
import { cn } from "@/lib/utils/cn";
import { Logo, Wordmark } from "./logo";
import { Tooltip } from "@/components/ui/tooltip";
import { KbdGroup } from "@/components/ui/kbd";
import { QuickCreate } from "./quick-create";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * The chrome stays quiet: mark, search, the seven destinations, and the one
 * action. The budget meter that used to sit in the footer belongs to Spend —
 * a spend gauge in every screen's corner is what a cost dashboard looks like,
 * and this is not one.
 */
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
          aria-label="Bench — Today"
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

      <div className={cn("shrink-0 border-t border-line-subtle p-2.5", collapsed && "px-2")}>
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

