import { cn } from "@/lib/utils/cn";

/**
 * The evidence marks.
 *
 * These are the app's signature: wherever a model, a prompt or a task type
 * appears, it carries its record. Tally marks rather than a number for small
 * samples, because "nine" reads as a statistic and "▏▏▏▏̸ ▏▏▏▏" reads as
 * exactly what it is — a handful of results you counted by hand.
 */

/** Above this many results, counting strokes stops being legible. */
const TALLY_LIMIT = 16;

export function TallyMarks({
  count,
  tone = "win",
  className,
  label,
}: {
  count: number;
  tone?: "win" | "loss" | "tie";
  className?: string;
  label?: string;
}) {
  const colors = {
    win: "var(--accent)",
    loss: "var(--line-strong)",
    tie: "var(--ink-4)",
  } as const;

  if (count > TALLY_LIMIT) {
    return (
      <span
        className={cn("font-mono text-[11px] font-medium tabular-nums", className)}
        style={{ color: colors[tone] }}
        aria-label={label}
      >
        {count}
      </span>
    );
  }

  const groups = Math.floor(count / 5);
  const remainder = count % 5;
  const groupWidth = 15;
  const strokeGap = 3.4;
  const width = groups * groupWidth + (remainder > 0 ? remainder * strokeGap + 2 : 0);

  return (
    <svg
      width={Math.max(width, 1)}
      height={11}
      viewBox={`0 0 ${Math.max(width, 1)} 11`}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={label ?? `${count}`}
    >
      {Array.from({ length: groups }).map((_, group) => {
        const x = group * groupWidth;
        return (
          <g key={group} stroke={colors[tone]} strokeWidth={1.5} strokeLinecap="round">
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={x + 1.5 + i * strokeGap} y1={1} x2={x + 1.5 + i * strokeGap} y2={10} />
            ))}
            <line x1={x + 0.5} y1={9.6} x2={x + 12.4} y2={1.4} />
          </g>
        );
      })}
      {Array.from({ length: remainder }).map((_, i) => (
        <line
          key={`r${i}`}
          x1={groups * groupWidth + 1.5 + i * strokeGap}
          y1={1}
          x2={groups * groupWidth + 1.5 + i * strokeGap}
          y2={10}
          stroke={colors[tone]}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/**
 * Win / loss / tie as one proportional bar. Reads as a shape before it reads
 * as numbers, which is what makes a column of them scannable.
 */
export function RecordBar({
  wins,
  losses,
  ties = 0,
  className,
  height = "md",
  label,
}: {
  wins: number;
  losses: number;
  ties?: number;
  className?: string;
  height?: "sm" | "md";
  label?: string;
}) {
  const total = wins + losses + ties;
  if (total === 0) {
    return (
      <div
        className={cn("rounded-full bg-surface-3", height === "sm" ? "h-1" : "h-1.5", className)}
        aria-label={label ?? "No record yet"}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-full bg-surface-3",
        height === "sm" ? "h-1" : "h-1.5",
        className,
      )}
      role="img"
      aria-label={label ?? `${wins} won, ${losses} lost${ties ? `, ${ties} tied` : ""}`}
    >
      <span style={{ width: `${(wins / total) * 100}%`, backgroundColor: "var(--accent)" }} />
      <span style={{ width: `${(ties / total) * 100}%`, backgroundColor: "var(--ink-4)" }} />
      <span style={{ width: `${(losses / total) * 100}%`, backgroundColor: "var(--line-strong)" }} />
    </div>
  );
}

/** W-L-T in mono, the way a league table prints it. */
export function RecordScore({
  wins,
  losses,
  ties = 0,
  className,
  size = "md",
}: {
  wins: number;
  losses: number;
  ties?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        size === "sm" ? "text-[11px]" : "text-[12.5px]",
        className,
      )}
    >
      <span className="font-semibold text-accent">{wins}</span>
      <span className="text-ink-4">–</span>
      <span className="text-ink-3">{losses}</span>
      {ties > 0 && (
        <>
          <span className="text-ink-4">–</span>
          <span className="text-ink-4">{ties}</span>
        </>
      )}
    </span>
  );
}

/** Recent results, newest first, the way a form guide prints it. */
export function FormStrip({
  form,
  className,
}: {
  form: Array<"W" | "L" | "T">;
  className?: string;
}) {
  if (form.length === 0) return null;
  return (
    <span
      className={cn("inline-flex items-center gap-[3px]", className)}
      role="img"
      aria-label={`Recent form, newest first: ${form.join(", ")}`}
    >
      {form.map((result, i) => (
        <span
          key={i}
          title={result === "W" ? "Won" : result === "L" ? "Lost" : "Tied"}
          className={cn(
            "block h-2.5 w-[5px] rounded-[1.5px]",
            result === "W" && "bg-accent",
            result === "T" && "bg-ink-4",
            result === "L" && "bg-line-strong",
          )}
          style={{ opacity: 1 - i * 0.09 }}
        />
      ))}
    </span>
  );
}
