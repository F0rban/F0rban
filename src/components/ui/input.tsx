import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const FIELD_BASE =
  "w-full rounded-md border border-line bg-surface-1 text-ink placeholder:text-ink-4 " +
  "transition-[border-color,box-shadow,background-color] duration-150 " +
  "hover:border-line-strong focus:border-accent focus:outline-none " +
  "focus:ring-[3px] focus:ring-accent/18 disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(FIELD_BASE, "h-8 px-2.5 text-[13px]", className)}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(FIELD_BASE, "min-h-20 resize-y px-2.5 py-2 text-[13px] leading-relaxed", className)}
        {...props}
      />
    );
  },
);

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
  required,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-baseline gap-1.5 text-[11.5px] font-medium text-ink-2"
      >
        {label}
        {required && <span className="text-accent">*</span>}
        {hint && <span className="font-normal text-ink-4">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          FIELD_BASE,
          "h-8 appearance-none pl-2.5 pr-7 text-[13px]",
          "bg-[image:var(--chevron)] bg-[length:12px] bg-[position:right_9px_center] bg-no-repeat",
          className,
        )}
        style={{
          // Inlined so the chevron picks up the current ink colour in both themes.
          ["--chevron" as string]:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394969e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});
