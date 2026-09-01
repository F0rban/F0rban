export type DiffType = "same" | "add" | "remove";

export interface DiffLine {
  type: DiffType;
  text: string;
  /** 1-based line number in the old text, or null for added lines. */
  oldLine: number | null;
  /** 1-based line number in the new text, or null for removed lines. */
  newLine: number | null;
}

/**
 * Line-level diff via longest common subsequence.
 *
 * Prompt bodies are tens of lines, so the quadratic table is free and the
 * result is exact — no heuristics to explain when it produces something odd.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");

  // lcs[i][j] = length of the longest common subsequence of a[i..] and b[j..]
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i]![j] = a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i]!, oldLine: i + 1, newLine: j + 1 });
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      out.push({ type: "remove", text: a[i]!, oldLine: i + 1, newLine: null });
      i++;
    } else {
      out.push({ type: "add", text: b[j]!, oldLine: null, newLine: j + 1 });
      j++;
    }
  }
  while (i < a.length) {
    out.push({ type: "remove", text: a[i]!, oldLine: i + 1, newLine: null });
    i++;
  }
  while (j < b.length) {
    out.push({ type: "add", text: b[j]!, oldLine: null, newLine: j + 1 });
    j++;
  }

  return out;
}

export interface DiffStat {
  added: number;
  removed: number;
}

export function diffStat(lines: DiffLine[]): DiffStat {
  return {
    added: lines.filter((l) => l.type === "add").length,
    removed: lines.filter((l) => l.type === "remove").length,
  };
}

/**
 * Collapses long unchanged stretches to a few lines of context, the way a code
 * review does — a prompt is mostly unchanged between versions and the point is
 * to see what moved.
 */
export function collapseContext(lines: DiffLine[], context = 2): Array<DiffLine | { type: "gap"; count: number }> {
  const keep = new Set<number>();
  lines.forEach((line, index) => {
    if (line.type === "same") return;
    for (let k = index - context; k <= index + context; k++) {
      if (k >= 0 && k < lines.length) keep.add(k);
    }
  });

  const out: Array<DiffLine | { type: "gap"; count: number }> = [];
  let gap = 0;
  lines.forEach((line, index) => {
    if (keep.has(index)) {
      if (gap > 0) {
        out.push({ type: "gap", count: gap });
        gap = 0;
      }
      out.push(line);
    } else {
      gap++;
    }
  });
  if (gap > 0) out.push({ type: "gap", count: gap });
  return out;
}
