/**
 * Small fuzzy matcher tuned for a command palette.
 *
 * Returns both a score and the matched character positions, so results can be
 * highlighted rather than just ranked. Scoring rewards, in order: an exact
 * prefix, a word-boundary hit, contiguous runs, and early matches.
 */

export interface FuzzyMatch {
  score: number;
  positions: number[];
}

const SEPARATORS = new Set([" ", "-", "_", ".", "/", ":", "(", "[", "—", "·"]);

function isBoundary(text: string, index: number): boolean {
  if (index === 0) return true;
  const prev = text[index - 1]!;
  if (SEPARATORS.has(prev)) return true;
  // camelCase boundary
  return prev === prev.toLowerCase() && text[index] !== text[index]!.toLowerCase();
}

export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  if (!query) return { score: 1, positions: [] };
  const q = query.toLowerCase();
  const lower = text.toLowerCase();

  // 1. Exact substring — by far the most common intent.
  const direct = lower.indexOf(q);
  if (direct !== -1) {
    const positions = Array.from({ length: q.length }, (_, i) => direct + i);
    let score = 1000 - direct * 2;
    if (direct === 0) score += 400;
    else if (isBoundary(text, direct)) score += 220;
    // Shorter haystacks that are mostly the query rank higher.
    score += Math.max(0, 120 - (text.length - q.length));
    return { score, positions };
  }

  // 2. Subsequence — every query char in order, anywhere.
  const positions: number[] = [];
  let cursor = 0;
  let score = 0;
  let streak = 0;

  for (const char of q) {
    if (char === " ") continue;
    const found = lower.indexOf(char, cursor);
    if (found === -1) return null;
    if (found === cursor && positions.length > 0) {
      streak += 1;
      score += 18 + streak * 6;
    } else {
      streak = 0;
      score += 6;
    }
    if (isBoundary(text, found)) score += 30;
    score -= Math.min(12, found - cursor);
    positions.push(found);
    cursor = found + 1;
  }

  score += Math.max(0, 60 - text.length / 2);
  return { score: Math.max(1, score), positions };
}

/** Best match across several fields, weighted by field importance. */
export function fuzzyMatchFields(
  query: string,
  fields: Array<{ text: string; weight: number; primary?: boolean }>,
): { score: number; positions: number[]; fieldIndex: number } | null {
  let best: { score: number; positions: number[]; fieldIndex: number } | null = null;
  fields.forEach((field, index) => {
    if (!field.text) return;
    const match = fuzzyMatch(query, field.text);
    if (!match) return;
    const weighted = match.score * field.weight;
    if (!best || weighted > best.score) {
      best = { score: weighted, positions: field.primary ? match.positions : [], fieldIndex: index };
    }
  });
  return best;
}

/** Splits text into alternating plain / highlighted segments for rendering. */
export function highlightSegments(
  text: string,
  positions: number[],
): Array<{ text: string; match: boolean }> {
  if (!positions.length) return [{ text, match: false }];
  const set = new Set(positions);
  const out: Array<{ text: string; match: boolean }> = [];
  let buffer = "";
  let bufferMatch = set.has(0);

  for (let i = 0; i < text.length; i++) {
    const isMatch = set.has(i);
    if (isMatch !== bufferMatch) {
      if (buffer) out.push({ text: buffer, match: bufferMatch });
      buffer = "";
      bufferMatch = isMatch;
    }
    buffer += text[i];
  }
  if (buffer) out.push({ text: buffer, match: bufferMatch });
  return out;
}
