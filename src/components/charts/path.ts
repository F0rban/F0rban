export interface Point {
  x: number;
  y: number;
}

/**
 * Monotone cubic interpolation — smooth without the overshoot that a plain
 * cardinal spline produces, which matters when a value must never appear to
 * dip below zero.
 */
export function monotonePath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  if (points.length === 2) {
    return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`;
  }

  const n = points.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const slopes: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1]!.x - points[i]!.x;
    dy[i] = points[i + 1]!.y - points[i]!.y;
    slopes[i] = dx[i]! === 0 ? 0 : dy[i]! / dx[i]!;
  }

  const tangents: number[] = new Array(n);
  tangents[0] = slopes[0]!;
  tangents[n - 1] = slopes[n - 2]!;
  for (let i = 1; i < n - 1; i++) {
    const a = slopes[i - 1]!;
    const b = slopes[i]!;
    tangents[i] = a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  }

  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const h = dx[i]! / 3;
    d += ` C ${p0.x + h} ${p0.y + tangents[i]! * h}, ${p1.x - h} ${p1.y - tangents[i + 1]! * h}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function linearPath(points: Point[]): string {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

/** A "nice" axis maximum: 1/2/5 × 10^n above the data. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const magnitude = 10 ** exp;
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}
