/** Date helpers. Every function takes an explicit `now` so they stay testable. */

const LOCALE = "en-US";

export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function daysInMonth(date: Date): number {
  return endOfMonth(date).getDate();
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDate(value: string | Date, style: "short" | "medium" | "day" = "medium"): string {
  const date = typeof value === "string" ? (value.length === 10 ? parseDay(value) : new Date(value)) : value;
  if (style === "day") {
    return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" }).format(date);
  }
  if (style === "short") {
    return new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric" }).format(date);
  }
  return new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit" }).format(date);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now" · "14m ago" · "3h ago" · "yesterday" · "4d ago" · "Mar 3". */
export function relativeTime(value: string | Date | null, now: Date = new Date()): string {
  if (!value) return "never";
  const date = typeof value === "string" ? (value.length === 10 ? parseDay(value) : new Date(value)) : value;
  const diff = now.getTime() - date.getTime();

  if (diff < 0) {
    const ahead = -diff;
    if (ahead < HOUR) return `in ${Math.max(1, Math.round(ahead / MINUTE))}m`;
    if (ahead < DAY) return `in ${Math.round(ahead / HOUR)}h`;
    if (ahead < 30 * DAY) return `in ${Math.round(ahead / DAY)}d`;
    return formatDate(date, "short");
  }
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return "yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  if (diff < 365 * DAY) return formatDate(date, "short");
  return formatDate(date, "medium");
}

/** Groups a timeline into "Today" / "Yesterday" / "This week" / month buckets. */
export function activityBucket(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((startToday.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / DAY);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "Earlier this week";
  if (diffDays < 30) return "Earlier this month";
  return new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" }).format(date);
}

export function daysBetween(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db.getTime() - da.getTime()) / DAY);
}
