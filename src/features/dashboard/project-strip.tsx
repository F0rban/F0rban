"use client";

import Link from "next/link";
import type { Project, SpendEntry } from "@/lib/data/types";
import { addDays, toDayKey } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/date";
import { Progress } from "@/components/ui/progress";
import { ProjectCode } from "@/features/projects/project-code";
import { cn } from "@/lib/utils/cn";

/** Compact project rows: progress, spend against budget, and last movement. */
export function ProjectStrip({
  projects,
  spend,
  now = new Date(),
}: {
  projects: Project[];
  spend: SpendEntry[];
  now?: Date;
}) {
  // Rolling 30 days rather than month-to-date: comparable to the monthly
  // budget, and never reads as zero on the 1st.
  const from = toDayKey(addDays(now, -29));
  const to = toDayKey(now);

  return (
    <ul className="divide-y divide-line-subtle">
      {projects.map((project) => {
        const done = project.tasks.filter((t) => t.done).length;
        const spent = spend
          .filter((e) => e.projectId === project.id && e.date >= from && e.date <= to)
          .reduce((sum, e) => sum + e.amount, 0);
        const overBudget = project.budget !== null && spent > project.budget;

        return (
          <li key={project.id}>
            <Link
              href={`/projects/${project.id}`}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2/60 sm:grid-cols-[auto_1fr_7rem_7rem]"
            >
              <ProjectCode project={project} />

              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-ink-2 transition-colors group-hover:text-ink">
                  {project.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-ink-4">
                  {done}/{project.tasks.length} tasks · updated {relativeTime(project.updatedAt, now)}
                </p>
              </div>

              <div className="hidden sm:block">
                <Progress
                  value={done}
                  max={Math.max(1, project.tasks.length)}
                  tone={done === project.tasks.length ? "positive" : "accent"}
                  size="sm"
                />
                <p className="mt-1 text-right font-mono text-[10px] tabular-nums text-ink-4">
                  {Math.round((done / Math.max(1, project.tasks.length)) * 100)}%
                </p>
              </div>

              <div className="text-right">
                <p
                  className={cn(
                    "font-mono text-[12px] font-medium tabular-nums",
                    overBudget ? "text-negative" : "text-ink",
                  )}
                >
                  {formatCurrency(spent)}
                </p>
                <p className="mt-0.5 font-mono text-[10px] tabular-nums text-ink-4">
                  {project.budget ? `of ${formatCurrency(project.budget, { maximumFractionDigits: 0 })}` : "no budget"}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
