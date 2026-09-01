import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "positive"
  | "warning"
  | "negative"
  | "info"
  | "outline";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-2 border-line",
  accent: "bg-accent-soft text-accent border-accent-line/60",
  positive: "bg-positive-soft text-positive border-positive/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  negative: "bg-negative-soft text-negative border-negative/25",
  info: "bg-info-soft text-info border-info/25",
  outline: "bg-transparent text-ink-3 border-line",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5",
        "text-[11px] font-medium leading-4 tracking-[0.005em]",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
