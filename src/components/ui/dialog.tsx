"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const Dialog = DialogPrimitive.Root;

export function DialogContent({
  className,
  children,
  size = "md",
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: "sm" | "md" | "lg" | "xl";
  hideClose?: boolean;
}) {
  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  } as const;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-scrim backdrop-blur-[2px]",
          "data-[state=open]:animate-fade-in",
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          "max-h-[min(88vh,52rem)] overflow-hidden rounded-xl border border-line",
          "bg-overlay shadow-lg data-[state=open]:animate-pop",
          "flex flex-col",
          widths[size],
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            className={cn(
              "absolute right-3 top-3 grid size-7 place-items-center rounded-md text-ink-3",
              "transition-colors hover:bg-surface-2 hover:text-ink",
            )}
            aria-label="Close"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shrink-0 border-b border-line-subtle px-5 py-3.5 pr-12", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-sm font-semibold tracking-[-0.01em] text-ink", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-0.5 text-xs text-ink-3", className)}
      {...props}
    />
  );
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t border-line-subtle bg-surface-2/40 px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}
