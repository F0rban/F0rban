"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Boxes,
  CircleDollarSign,
  Cpu,
  FolderKanban,
  Play,
  SquarePen,
  TriangleAlert,
  Gavel,
  Swords,
  Trophy,
} from "lucide-react";
import type { ActivityEvent, ActivityKind } from "@/lib/data/types";
import { activityBucket, formatTime } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<ActivityKind, React.ElementType> = {
  "prompt.run": Play,
  "prompt.created": SquarePen,
  "prompt.updated": SquarePen,
  "duel.started": Swords,
  "duel.decided": Trophy,
  "verdict.changed": Gavel,
  "tool.added": Boxes,
  "tool.status": Boxes,
  "model.scored": Cpu,
  "project.updated": FolderKanban,
  "project.created": FolderKanban,
  "spend.recorded": CircleDollarSign,
  "budget.alert": TriangleAlert,
};

const HREFS: Record<string, (id: string) => string> = {
  prompt: (id) => `/prompts?prompt=${id}`,
  project: (id) => `/projects/${id}`,
  tool: (id) => `/tools?tool=${id}`,
  model: (id) => `/models?model=${id}`,
  duel: (id) => `/duels/${id}`,
  spend: () => "/spending",
};

/**
 * Timeline of what actually happened, bucketed by day.
 *
 * Seeded history and live events share one shape, so an action taken in the app
 * lands in the same feed as the generated past — the timeline stays honest.
 */
export function ActivityFeed({
  events,
  limit = 16,
  className,
}: {
  events: ActivityEvent[];
  limit?: number;
  className?: string;
}) {
  const groups = useMemo(() => {
    const now = new Date();
    const out: Array<{ bucket: string; events: ActivityEvent[] }> = [];
    for (const event of events.slice(0, limit)) {
      const bucket = activityBucket(event.at, now);
      const last = out[out.length - 1];
      if (last?.bucket === bucket) last.events.push(event);
      else out.push({ bucket, events: [event] });
    }
    return out;
  }, [events, limit]);

  return (
    <div className={cn("px-4 pb-3", className)}>
      {groups.map((group) => (
        <section key={group.bucket}>
          <h3 className="sticky top-0 z-10 -mx-4 bg-surface-1/92 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4 backdrop-blur-sm">
            {group.bucket}
          </h3>
          <ol className="relative">
            {/* The spine: one line, not a border per row. */}
            <span aria-hidden className="absolute bottom-3 left-[11px] top-1 w-px bg-line-subtle" />
            {group.events.map((event) => {
              const Icon = ICONS[event.kind] ?? Play;
              const href =
                event.entityType && event.entityId
                  ? HREFS[event.entityType]?.(event.entityId)
                  : event.entityType === "spend"
                    ? "/spending"
                    : undefined;

              const body = (
                <>
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 grid size-[23px] shrink-0 place-items-center rounded-full",
                      "border border-line bg-surface-1 text-ink-4 transition-colors",
                      event.kind === "budget.alert" && "border-warning/40 text-warning",
                      href && "group-hover:border-line-strong group-hover:text-ink-3",
                    )}
                  >
                    <Icon className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1 pb-3">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-[12.5px] font-medium leading-snug text-ink-2",
                          href && "group-hover:text-ink",
                        )}
                      >
                        {event.title}
                      </span>
                      <span
                        className="shrink-0 font-mono text-[10px] tabular-nums text-ink-4"
                        title={new Date(event.at).toLocaleString()}
                      >
                        {formatTime(event.at)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate text-[11.5px] leading-snug text-ink-4">
                        {event.detail}
                      </span>
                      {event.cost !== null && (
                        <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink-3">
                          {formatCurrency(event.cost, { maximumFractionDigits: event.cost < 1 ? 3 : 2 })}
                        </span>
                      )}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={event.id}>
                  {href ? (
                    <Link href={href} className="group flex gap-2.5">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex gap-2.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {events.length === 0 && (
        <p className="py-8 text-center text-[12.5px] text-ink-4">No activity yet.</p>
      )}
    </div>
  );
}

