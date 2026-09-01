import type { Project } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";

const SIZES = {
  sm: "px-1.5 py-0.5 text-[9.5px] rounded-[5px]",
  md: "px-2 py-1 text-[11px] rounded-md",
} as const;

/** The project's short code, tinted with its series colour. */
export function ProjectCode({
  project,
  size = "sm",
  className,
}: {
  project: Pick<Project, "code" | "series">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const color = `var(--series-${((project.series - 1) % 8) + 1})`;
  return (
    <span
      className={cn("shrink-0 border font-mono font-semibold tabular-nums", SIZES[size], className)}
      style={{
        color,
        borderColor: `color-mix(in oklch, ${color} 34%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
      }}
    >
      {project.code}
    </span>
  );
}
