"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight, CircleAlert, CircleCheck, Info } from "lucide-react";
import type { AttentionItem, Severity } from "@/lib/analytics/attention";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<Severity, React.ElementType> = {
  critical: CircleAlert,
  warning: AlertTriangle,
  info: Info,
};

const TONES: Record<Severity, string> = {
  critical: "text-negative",
  warning: "text-warning",
  info: "text-info",
};

/**
 * The panel that earns the dashboard its place: derived signals with a date or
 * a number attached, each linking to the thing that needs the decision.
 */
export function AttentionPanel({ items, limit = 6 }: { items: AttentionItem[]; limit?: number }) {
  const shown = items.slice(0, limit);
  const criticals = items.filter((i) => i.severity === "critical").length;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Needs attention</CardTitle>
          <p className="mt-0.5 text-xs text-ink-3">
            {items.length === 0
              ? "Nothing is drifting right now"
              : `${items.length} item${items.length === 1 ? "" : "s"} derived from your stack today`}
          </p>
        </div>
        {criticals > 0 && (
          <Badge tone="negative" dot>
            {criticals} urgent
          </Badge>
        )}
      </CardHeader>

      {shown.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-6">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-positive/25 bg-positive-soft text-positive">
            <CircleCheck className="size-4" />
          </span>
          <p className="text-[12.5px] leading-snug text-ink-3">
            No trials expiring, no idle subscriptions, nothing over budget and no overdue tasks.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line-subtle">
          {shown.map((item) => {
            const Icon = ICONS[item.severity];
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-surface-2/60"
                >
                  <Icon className={cn("mt-0.5 size-3.5 shrink-0", TONES[item.severity])} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-medium leading-snug text-ink">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-3">
                      {item.detail}
                    </span>
                  </span>
                  <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > limit && (
        <div className="border-t border-line-subtle px-4 py-2">
          <span className="text-[11.5px] text-ink-4">
            +{items.length - limit} more, sorted by urgency
          </span>
        </div>
      )}
    </Card>
  );
}
