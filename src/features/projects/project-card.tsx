"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import type { Project } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProviderMark } from "@/components/ui/provider-mark";
import { ProjectCode } from "./project-code";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "./project-meta";
import { formatCurrency } from "@/lib/utils/format";
import { formatDate, relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { ProviderId } from "@/lib/data/types";

export function ProjectCard({
  project,
  spent,
  providers,
  now,
}: {
  project: Project;
  spent: number;
  providers: ProviderId[];
  now: Date;
}) {
  const done = project.tasks.filter((t) => t.done).length;
  const overBudget = project.budget !== null && spent > project.budget;
  const budgetPct = project.budget ? (spent / project.budget) * 100 : 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "group flex flex-col rounded-xl border border-line bg-surface-1 p-4 shadow-xs",
        "transition-[border-color,box-shadow,transform] duration-200",
        "hover:-translate-y-px hover:border-line-strong hover:shadow-md",
        project.status === "archived" && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <ProjectCode project={project} size="md" />
        <Badge tone={PROJECT_STATUS_TONE[project.status]} dot>
          {PROJECT_STATUS_LABEL[project.status]}
        </Badge>
        <span className="ml-auto font-mono text-[10.5px] tabular-nums text-ink-4">
          {relativeTime(project.updatedAt, now)}
        </span>
      </div>

      <h3 className="mt-3 text-[14px] font-semibold leading-snug tracking-[-0.01em] text-ink">
        {project.name}
      </h3>
      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-3">
        {project.description}
      </p>

      <div className="mt-auto pt-4">
        <div className="flex items-baseline justify-between gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-ink-4">
            <CheckCircle2 className="size-3" />
            <span className="font-mono tabular-nums">
              {done}/{project.tasks.length}
            </span>
            tasks
          </span>
          {project.dueDate && (
            <span className="flex items-center gap-1.5 text-ink-4">
              <CalendarDays className="size-3" />
              {formatDate(project.dueDate, "short")}
            </span>
          )}
        </div>
        <Progress
          className="mt-1.5"
          value={done}
          max={Math.max(1, project.tasks.length)}
          tone={done === project.tasks.length ? "positive" : "accent"}
          size="sm"
          label={`${project.name} task progress`}
        />

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-line-subtle pt-3">
          <div>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-4">
              30-day spend
            </p>
            <p className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums">
              <span className={overBudget ? "text-negative" : "text-ink"}>
                {formatCurrency(spent, { maximumFractionDigits: 0 })}
              </span>
              {project.budget !== null && (
                <span className="text-[10px] font-normal text-ink-4">
                  {" "}
                  / {formatCurrency(project.budget, { maximumFractionDigits: 0 })}
                  {budgetPct >= 80 && !overBudget && (
                    <span className="ml-1 text-warning">{Math.round(budgetPct)}%</span>
                  )}
                </span>
              )}
            </p>
          </div>
          {/* Not overlapped: two-letter monograms are unreadable when a
              neighbour covers half of them. Overlap is for circular photos. */}
          <div className="flex gap-1">
            {providers.slice(0, 4).map((provider) => (
              <ProviderMark key={provider} provider={provider} size="xs" />
            ))}
            {providers.length > 4 && (
              <span className="grid size-5 place-items-center rounded-[5px] border border-line bg-surface-2 font-mono text-[8.5px] text-ink-4">
                +{providers.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
