"use client";

import { Check, ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown";
import { cn } from "@/lib/utils/cn";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/** Multi-select filter as a dropdown, with the active count on the trigger. */
export function FilterMenu({
  label,
  options,
  selected,
  onChange,
  className,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] font-medium",
          "transition-colors duration-150 data-[state=open]:bg-surface-2",
          selected.length
            ? "border-accent-line bg-accent-soft text-accent"
            : "border-line text-ink-2 hover:border-line-strong hover:bg-surface-2",
          className,
        )}
      >
        {label}
        {selected.length > 0 && (
          <span className="font-mono text-[10.5px] tabular-nums">{selected.length}</span>
        )}
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onSelect={(event) => {
              event.preventDefault();
              toggle(option.value);
            }}
          >
            <span className="flex-1 truncate">{option.label}</span>
            {option.count !== undefined && (
              <span className="font-mono text-[10.5px] tabular-nums text-ink-4">{option.count}</span>
            )}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])}>
              <X />
              Clear
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SortMenu<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5",
          "text-[12.5px] text-ink-2 transition-colors duration-150",
          "hover:border-line-strong hover:bg-surface-2 data-[state=open]:bg-surface-2",
          className,
        )}
      >
        <span className="text-ink-4">Sort</span>
        <span className="font-medium">{current?.label}</span>
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onSelect={() => onChange(option.value)}>
            <span className="grid size-3.5 place-items-center">
              {option.value === value && <Check className="size-3.5 text-accent" />}
            </span>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Small toggle used for boolean filters like "Starred only". */
export function FilterToggle({
  active,
  onClick,
  children,
  className,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  /** Required when the content is icon-only, so the control has a name. */
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] font-medium",
        "transition-colors duration-150",
        active
          ? "border-accent-line bg-accent-soft text-accent"
          : "border-line text-ink-2 hover:border-line-strong hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** One-line summary of what is filtered, with a reset. */
export function FilterSummary({
  shown,
  total,
  noun,
  onReset,
  active,
}: {
  shown: number;
  total: number;
  noun: string;
  onReset: () => void;
  active: boolean;
}) {
  return (
    <p className="flex items-center gap-2 text-[11.5px] text-ink-4">
      <span className="tabular-nums">
        {shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`}
      </span>
      {active && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-accent transition-opacity hover:opacity-75"
        >
          <X className="size-3" />
          Reset filters
        </button>
      )}
    </p>
  );
}
