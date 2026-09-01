import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "dot-field flex flex-col items-center justify-center rounded-lg border border-dashed border-line text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className,
      )}
    >
      {icon && (
        <span className="mb-3 grid size-9 place-items-center rounded-lg border border-line bg-surface-1 text-ink-3 shadow-xs [&_svg]:size-4">
          {icon}
        </span>
      )}
      <p className="text-[13px] font-medium text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-balance text-xs leading-relaxed text-ink-3">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
