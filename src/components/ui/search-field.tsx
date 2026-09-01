"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Search, X } from "lucide-react";
import { useHotkey } from "@/hooks/use-hotkey";
import { Kbd } from "./kbd";
import { cn } from "@/lib/utils/cn";

/**
 * Page-level search box, focusable with "/" the way every developer tool does.
 * Escape clears then blurs, so it never traps the keyboard.
 */
export const SearchField = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    resultCount?: number;
    ariaLabel?: string;
  }
>(function SearchField(
  { value, onChange, placeholder = "Search…", className, resultCount, ariaLabel },
  forwardedRef,
) {
  const ref = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => ref.current!, []);
  useHotkey("/", () => ref.current?.focus());

  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        aria-label={ariaLabel ?? placeholder}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            if (value) onChange("");
            else ref.current?.blur();
          }
        }}
        className={cn(
          "h-8 w-full rounded-md border border-line bg-surface-1 pl-8 pr-16 text-[13px] text-ink",
          "placeholder:text-ink-4 transition-[border-color,box-shadow] duration-150",
          "hover:border-line-strong focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/18",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {value ? (
          <>
            {resultCount !== undefined && (
              <span className="font-mono text-[10.5px] tabular-nums text-ink-4">{resultCount}</span>
            )}
            <button
              type="button"
              onClick={() => {
                onChange("");
                ref.current?.focus();
              }}
              aria-label="Clear search"
              className="grid size-5 place-items-center rounded text-ink-4 transition-colors hover:bg-surface-2 hover:text-ink-2"
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <Kbd className="hidden sm:inline-flex">/</Kbd>
        )}
      </span>
    </div>
  );
});
