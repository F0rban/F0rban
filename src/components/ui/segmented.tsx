"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  /** Required when `label` is empty, so an icon-only segment still has a name. */
  ariaLabel?: string;
}

/**
 * macOS-style segmented control. The active pill is a real element that slides,
 * rather than a background swap — it reads as one control, not four buttons.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  ariaLabel,
}: {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const id = useId();
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center rounded-lg border border-line bg-surface-2 p-0.5",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 rounded-[6px] border border-line bg-surface-1 shadow-xs transition-[left,width] duration-250 ease-[var(--ease-out-quint)]"
        style={{
          left: `calc(${(index / options.length) * 100}% + 2px)`,
          width: `calc(${100 / options.length}% - 4px)`,
        }}
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            id={`${id}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.ariaLabel}
            title={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 flex-1 whitespace-nowrap rounded-[6px] font-medium transition-colors duration-150",
              size === "sm" ? "h-6 px-2 text-[11.5px]" : "h-7 px-3 text-[12.5px]",
              active ? "text-ink" : "text-ink-3 hover:text-ink-2",
              option.icon && "inline-flex items-center justify-center gap-1.5",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
