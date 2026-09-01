"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Keyboard, Menu, Search } from "lucide-react";
import { findNavItem } from "@/lib/navigation";
import { useUiStore } from "@/lib/store/ui";
import { cn } from "@/lib/utils/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { KbdGroup } from "@/components/ui/kbd";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const pathname = usePathname();
  const pageTitle = useUiStore((s) => s.pageTitle);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const item = findNavItem(pathname);
  const isDetail = pathname.split("/").filter(Boolean).length > 1;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line",
        "bg-canvas/85 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-canvas/70 sm:px-5",
      )}
    >
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
        className="-ml-1 grid size-9 shrink-0 place-items-center rounded-md text-ink-2 transition-colors hover:bg-surface-2 md:hidden"
      >
        <Menu className="size-4.5" />
      </button>

      <Link href="/" aria-label="Dashboard" className="text-accent md:hidden">
        <Logo size={20} />
      </Link>

      {/* Chrome, not content: the page's own <h1> is the heading. This is a
          breadcrumb, so it is a nav landmark rather than a second heading. */}
      <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
        <ol className="flex min-w-0 items-baseline gap-2">
          {isDetail && item ? (
            <>
              <li className="shrink-0">
                <Link
                  href={item.href}
                  className="text-[13px] text-ink-3 transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
              <li aria-hidden className="shrink-0 text-ink-4">
                /
              </li>
              <li className="min-w-0">
                <span
                  aria-current="page"
                  className="block truncate text-[13px] font-semibold tracking-[-0.005em] text-ink"
                >
                  {pageTitle ?? "Detail"}
                </span>
              </li>
            </>
          ) : (
            <li className="min-w-0">
              <span
                aria-current="page"
                className="block truncate text-[13px] font-semibold tracking-[-0.005em] text-ink"
              >
                {item?.label ?? "Command Center"}
              </span>
            </li>
          )}
        </ol>
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search"
        className="grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
      >
        <Search className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className={cn(
          "group hidden h-8 items-center gap-2 rounded-md border border-line bg-surface-1 pl-2 pr-1.5",
          "text-[12.5px] text-ink-4 transition-colors hover:border-line-strong hover:bg-surface-2 md:flex lg:hidden",
        )}
      >
        <Search className="size-3.5" />
        <KbdGroup keys={["⌘", "K"]} />
      </button>

      <Tooltip content={<span className="flex items-center gap-1.5">Keyboard shortcuts <KbdGroup keys={["?"]} /></span>}>
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          aria-label="Keyboard shortcuts"
          className="hidden size-8 place-items-center rounded-md text-ink-4 transition-colors hover:bg-surface-2 hover:text-ink-2 sm:grid"
        >
          <Keyboard className="size-4" />
        </button>
      </Tooltip>

      <ThemeToggle />
    </header>
  );
}
