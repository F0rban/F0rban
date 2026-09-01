"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/spend", label: "Usage & budget" },
  { href: "/tools", label: "Subscriptions" },
] as const;

/**
 * Two routes presented as one section.
 *
 * Subscriptions are a money question, not a browsable catalogue — they used to
 * be their own top-level destination and did not earn it.
 */
export function SpendTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Spend sections" className="mt-4 flex items-center gap-0.5 border-b border-line">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors duration-150",
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-3 hover:text-ink-2",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
