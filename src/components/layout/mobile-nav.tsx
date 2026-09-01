"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import { NAVIGATION, PRIMARY_NAV_ITEMS } from "@/lib/navigation";
import { useUiStore } from "@/lib/store/ui";
import { cn } from "@/lib/utils/cn";
import { Logo, Wordmark } from "./logo";
import { QuickCreate } from "./quick-create";
import { ThemeToggle } from "./theme-toggle";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Mobile navigation is a different design, not a narrower sidebar: the five
 * most-used destinations live in a thumb-reachable bottom bar, and the full
 * navigation is a slide-over reached from the top-left.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-canvas/92 backdrop-blur-xl md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {PRIMARY_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
              active ? "text-ink" : "text-ink-4",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-0.5 w-8 rounded-b-full bg-accent transition-opacity duration-200",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <item.icon className={cn("size-[18px]", active && "text-accent")} strokeWidth={active ? 2.1 : 1.9} />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavSheet() {
  const pathname = usePathname();
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
        className="absolute inset-0 animate-fade-in bg-scrim backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(19rem,84vw)] flex-col border-r border-line bg-surface-1",
          "shadow-lg motion-safe:animate-[rise_0.25s_var(--ease-out-quint)_both]",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line-subtle px-4">
          <span className="flex items-center gap-2.5 text-accent">
            <Logo />
            <Wordmark />
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="-mr-1 grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          {NAVIGATION.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-start gap-3 rounded-lg px-2 py-2 transition-colors",
                          active ? "bg-surface-2" : "hover:bg-surface-2/70",
                        )}
                      >
                        <item.icon
                          className={cn("mt-px size-4 shrink-0", active ? "text-accent" : "text-ink-4")}
                        />
                        <span className="min-w-0">
                          <span className={cn("block text-[13px] font-medium", active ? "text-ink" : "text-ink-2")}>
                            {item.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-ink-4">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 border-t border-line-subtle p-3">
          <QuickCreate />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
