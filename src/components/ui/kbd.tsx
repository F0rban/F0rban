import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** A single key cap. Pass the glyph you want shown — no translation here. */
export function Kbd({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-line",
        "bg-surface-2 px-1 font-sans text-[10.5px] font-medium leading-none text-ink-3",
        "shadow-[0_1px_0_var(--line)]",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export function KbdGroup({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {keys.map((key, i) => (
        <Kbd key={`${key}-${i}`}>{key}</Kbd>
      ))}
    </span>
  );
}
