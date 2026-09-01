"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils/cn";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full",
        "border border-line bg-surface-3 transition-colors duration-200",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-3.5 rounded-full bg-surface-1 shadow-sm",
          "translate-x-[1px] transition-transform duration-200 ease-[var(--ease-out-quint)]",
          "data-[state=checked]:translate-x-[15px] data-[state=checked]:bg-white",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export function SwitchField({
  label,
  description,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & { label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 py-1">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-3">{description}</span>}
      </span>
      <Switch {...props} />
    </label>
  );
}
