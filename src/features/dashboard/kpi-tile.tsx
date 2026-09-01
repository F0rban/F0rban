"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { Delta, StatLabel, StatValue } from "@/components/ui/stat";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export function KpiTile({
  label,
  value,
  sub,
  delta,
  deltaInverted,
  spark,
  sparkColor,
  href,
  footer,
  className,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  delta?: number | null;
  deltaInverted?: boolean;
  spark?: number[];
  sparkColor?: string;
  href?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <StatLabel>{label}</StatLabel>
        {href && (
          <ArrowUpRight className="size-3.5 shrink-0 text-ink-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <StatValue className="text-[22px] leading-7 sm:text-[26px] sm:leading-8">
            {value}
          </StatValue>
          {(sub || delta !== undefined) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2">
              {delta !== undefined && <Delta value={delta} inverted={deltaInverted} />}
              {sub && <span className="truncate text-[11.5px] text-ink-3">{sub}</span>}
            </div>
          )}
        </div>
        {spark && spark.length > 1 && (
          <Sparkline
            values={spark}
            color={sparkColor ?? "var(--accent)"}
            className="mb-1 hidden shrink-0 sm:block"
          />
        )}
      </div>

      {/* The footer is supporting detail; on a phone the headline plus the
          delta is the whole point of a tile. */}
      {footer && (
        <div className="mt-3 hidden border-t border-line-subtle pt-2.5 sm:block">{footer}</div>
      )}
    </>
  );

  const classes = cn(
    "group rounded-xl border border-line bg-surface-1 p-3.5 shadow-xs",
    href &&
      "transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-line-strong hover:shadow-md",
    className,
  );

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-3.5">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="mt-3 h-7 w-28" />
      <Skeleton className="mt-2 h-2.5 w-24" />
    </div>
  );
}
