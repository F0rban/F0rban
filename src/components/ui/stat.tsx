import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Delta({
  value,
  /** For spend, up is bad. For usage, up is good. */
  inverted,
  suffix = "%",
  className,
}: {
  value: number | null;
  inverted?: boolean;
  suffix?: string;
  className?: string;
}) {
  if (value === null) {
    return <span className={cn("text-[11.5px] text-ink-4", className)}>—</span>;
  }
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const good = flat ? null : inverted ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11.5px] font-medium tabular-nums",
        good === null && "text-ink-4",
        good === true && "text-positive",
        good === false && "text-negative",
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {flat ? "0" : Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0)}
      {suffix}
    </span>
  );
}

export function StatLabel({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4",
        className,
      )}
      {...props}
    />
  );
}

export function StatValue({
  className,
  size = "md",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "block font-semibold tabular-nums tracking-[-0.02em] text-ink",
        size === "sm" && "text-lg",
        size === "md" && "text-[26px] leading-8",
        size === "lg" && "text-[34px] leading-10",
        className,
      )}
      {...props}
    />
  );
}
