"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Boxes, Command, Cpu, Play, SquarePen } from "lucide-react";
import type { Workspace } from "@/lib/data/types";
import { useUiStore } from "@/lib/store/ui";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface Action {
  key: string;
  label: string;
  detail: string;
  icon: React.ElementType;
  href: string;
  keys?: string[];
}

/**
 * Shortcuts that point at this workspace, not at section landing pages.
 *
 * A generic "Compare models" tile is a nav link with a picture on it. Naming
 * the prompt you actually run, the trial that is actually expiring and the
 * models you actually starred makes the block worth its space.
 */
function deriveActions(workspace: Workspace): Action[] {
  const actions: Action[] = [];

  const topPrompt = [...workspace.prompts].sort((a, b) => b.useCount - a.useCount)[0];
  if (topPrompt) {
    actions.push({
      key: "prompt",
      label: `Run ${topPrompt.title}`,
      detail: `Your most-used · ${formatNumber(topPrompt.useCount)} runs`,
      icon: Play,
      href: `/prompts?prompt=${topPrompt.id}`,
    });
  }

  // Whatever is most urgent about the stack: an expiring trial first, then the
  // most expensive tool nobody is opening.
  const trial = workspace.tools.find((t) => t.status === "trial");
  const idle = [...workspace.tools]
    .filter((t) => t.status === "active" && t.monthlyCost > 0 && t.usage30d < 12)
    .sort((a, b) => b.monthlyCost - a.monthlyCost)[0];

  if (trial) {
    actions.push({
      key: "trial",
      label: `Decide on ${trial.name}`,
      detail: `Trial · ${formatCurrency(trial.monthlyCost)}/mo if kept`,
      icon: Boxes,
      href: `/tools?tool=${trial.id}`,
    });
  } else if (idle) {
    actions.push({
      key: "idle",
      label: `Review ${idle.name}`,
      detail: `${formatCurrency(idle.monthlyCost)}/mo · ${idle.usage30d} uses in 30 days`,
      icon: Boxes,
      href: `/tools?tool=${idle.id}`,
    });
  }

  const starred = workspace.models.filter((m) => m.favorite);
  if (starred.length >= 2) {
    actions.push({
      key: "models",
      label: `Compare ${starred[0]!.name.split(" ").slice(-2).join(" ")} vs ${starred[1]!.name.split(" ").slice(-2).join(" ")}`,
      detail: "Price, speed and capability side by side",
      icon: Cpu,
      href: `/models?model=${starred[0]!.id}`,
    });
  }

  actions.push({
    key: "new",
    label: "New prompt",
    detail: "Start from a blank template",
    icon: SquarePen,
    href: "/prompts?new=1",
    keys: ["N"],
  });

  return actions.slice(0, 4);
}

export function QuickActions({
  workspace,
  className,
}: {
  workspace: Workspace | null;
  className?: string;
}) {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const actions = useMemo(() => (workspace ? deriveActions(workspace) : []), [workspace]);

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

      {actions.length === 0
        ? Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[86px] rounded-xl" />
          ))
        : actions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
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
                <span className="line-clamp-2 block text-[12.5px] font-medium leading-snug text-ink">
                  {action.label}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-ink-4">
                  {action.detail}
                </span>
              </span>
            </Link>
          ))}
    </div>
  );
}
