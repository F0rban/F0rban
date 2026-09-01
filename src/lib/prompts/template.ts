import type { Prompt, PromptVariable } from "../data/types";

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/** Unique variable names in body order. */
export function extractVariableNames(body: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const match of body.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

export interface RenderResult {
  text: string;
  /** Variables referenced in the body that have no value. */
  missing: string[];
  filled: number;
  total: number;
}

/**
 * Substitutes {{name}} placeholders. Unfilled variables are left as-is rather
 * than blanked, so a partially filled prompt is still copy-pasteable and the
 * gaps stay visible.
 */
export function renderTemplate(body: string, values: Record<string, string>): RenderResult {
  const names = extractVariableNames(body);
  const missing: string[] = [];

  const text = body.replace(VARIABLE_PATTERN, (whole, rawName: string) => {
    const value = values[rawName];
    if (value === undefined || value.trim() === "") return whole;
    return value;
  });

  for (const name of names) {
    const value = values[name];
    if (value === undefined || value.trim() === "") missing.push(name);
  }

  return { text, missing, filled: names.length - missing.length, total: names.length };
}

export type SegmentKind = "text" | "filled" | "missing";

export interface RenderSegment {
  text: string;
  kind: SegmentKind;
  name?: string;
}

/**
 * Renders to segments instead of a string, so the preview can show which parts
 * came from a variable and which placeholders are still empty.
 */
export function renderSegments(
  body: string,
  values: Record<string, string>,
): RenderSegment[] {
  const segments: RenderSegment[] = [];
  let cursor = 0;

  for (const match of body.matchAll(VARIABLE_PATTERN)) {
    const start = match.index!;
    if (start > cursor) segments.push({ text: body.slice(cursor, start), kind: "text" });
    const name = match[1]!;
    const value = values[name];
    if (value !== undefined && value.trim() !== "") {
      segments.push({ text: value, kind: "filled", name });
    } else {
      segments.push({ text: match[0], kind: "missing", name });
    }
    cursor = start + match[0].length;
  }

  if (cursor < body.length) segments.push({ text: body.slice(cursor), kind: "text" });
  return segments;
}

/** Character offsets of every placeholder, for editor highlighting. */
export function variableRanges(body: string): Array<{ start: number; end: number; name: string }> {
  const ranges: Array<{ start: number; end: number; name: string }> = [];
  for (const match of body.matchAll(VARIABLE_PATTERN)) {
    ranges.push({
      start: match.index!,
      end: match.index! + match[0].length,
      name: match[1]!,
    });
  }
  return ranges;
}

function humanize(name: string): string {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Reconciles a prompt's declared variables with the ones its body actually
 * uses: keeps existing definitions, adds stubs for new placeholders, drops
 * definitions whose placeholder is gone. Called on every prompt save.
 */
export function syncVariables(body: string, existing: PromptVariable[]): PromptVariable[] {
  const names = extractVariableNames(body);
  const byName = new Map(existing.map((v) => [v.name, v]));
  return names.map(
    (name) =>
      byName.get(name) ?? {
        name,
        label: humanize(name),
        description: "",
        type: "text",
        defaultValue: "",
      },
  );
}

/** Default values for every variable, used to seed the fill-in panel. */
export function defaultValues(prompt: Pick<Prompt, "variables">): Record<string, string> {
  const out: Record<string, string> = {};
  for (const variable of prompt.variables) out[variable.name] = variable.defaultValue;
  return out;
}

/** Rough token estimate — 4 characters per token is close enough for a hint. */
export function estimateTokens(text: string): number {
  return Math.max(0, Math.round(text.length / 4));
}
