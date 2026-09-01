"use client";

import Link from "next/link";
import { Command, Cpu, Play, SquarePen, Wallet } from "lucide-react";
import { useUiStore } from "@/lib/store/ui";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils/cn";

interface Action {
  label: string;
  detail: string;
  icon: React.ElementType;
  href?: string;
  keys?: string[];
}

const ACTIONS: Action[] = [
  { label: "Run a prompt", detail: "Fill variables and copy", icon: Play, href: "/prompts" },
  { label: "New prompt", detail: "Start from blank", icon: SquarePen, href: "/prompts?new=1", keys: ["N"] },
  { label: "Compare models", detail: "Price, speed, capability", icon: Cpu, href: "/models" },
  { label: "Review spend", detail: "Budget and forecast", icon: Wallet, href: "/spending" },
];

export function QuickActions({ className }: { className?: string }) {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className={cn(
          "group col-span-2 flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-3 text-left",
          "shadow-xs transition-[border-color,box-shadow,transform] duration-200",
          "hover:-translate-y-px hover:border-accent-line hover:shadow-md",
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-accent-line/60 bg-accent-soft text-accent">
          <Command className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-medium text-ink">Search everything</span>
          <span className="block truncate text-[11px] text-ink-4">
            Prompts, tools, models, projects and commands
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      {ACTIONS.map((action) => (
        <Link
          key={action.label}
          href={action.href ?? "#"}
          className={cn(
            "group flex flex-col gap-2 rounded-xl border border-line bg-surface-1 p-3",
            "shadow-xs transition-[border-color,box-shadow,transform] duration-200",
            "hover:-translate-y-px hover:border-line-strong hover:shadow-md",
          )}
        >
          <span className="flex items-center justify-between">
            <action.icon className="size-4 text-ink-4 transition-colors group-hover:text-accent" />
            {action.keys && (
              <span className="flex gap-1">
                {action.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            )}
          </span>
          <span>
            <span className="block text-[12.5px] font-medium leading-snug text-ink">
              {action.label}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-ink-4">{action.detail}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
