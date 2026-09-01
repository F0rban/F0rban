"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  align = "end",
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={5}
        collisionPadding={10}
        className={cn(
          "z-50 min-w-44 overflow-hidden rounded-lg border border-line bg-overlay p-1 shadow-lg",
          "data-[state=open]:animate-pop",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  danger,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Item> & { danger?: boolean }) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5",
        "text-[12.5px] text-ink-2 outline-none transition-colors",
        "data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
        "[&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-ink-3",
        danger && "text-negative data-[highlighted]:bg-negative-soft data-[highlighted]:text-negative [&_svg]:text-negative",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.CheckboxItem>) {
  return (
    <DropdownPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-md py-1.5 pl-2 pr-2",
        "text-[12.5px] text-ink-2 outline-none transition-colors",
        "data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink",
        className,
      )}
      {...props}
    >
      <span className="grid size-3.5 shrink-0 place-items-center">
        <DropdownPrimitive.ItemIndicator>
          <Check className="size-3.5 text-accent" />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.CheckboxItem>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn("px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-4", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator className={cn("my-1 h-px bg-line-subtle", className)} {...props} />
  );
}

export function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto text-[10.5px] text-ink-4", className)} {...props} />;
}
