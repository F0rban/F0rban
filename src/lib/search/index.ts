import type { EntityType, Workspace } from "../data/types";
import { fuzzyMatch } from "./fuzzy";

export interface SearchRecord {
  id: string;
  type: EntityType;
  title: string;
  subtitle: string;
  /** Extra text folded into matching but never displayed. */
  keywords: string;
  href: string;
  /** Ranking nudge for things the user touches often. */
  boost: number;
  meta?: string;
  favorite?: boolean;
}

export interface SearchHit extends SearchRecord {
  score: number;
  positions: number[];
}

const TYPE_LABELS: Record<EntityType, string> = {
  tool: "Tool",
  model: "Model",
  prompt: "Prompt",
  project: "Project",
  workflow: "Workflow",
  spend: "Spend",
};

export function typeLabel(type: EntityType): string {
  return TYPE_LABELS[type];
}

/**
 * Flattens the workspace into one searchable list. Rebuilt whenever the
 * workspace changes — cheap at this scale (a few hundred records) and keeps
 * the palette honest about what actually exists.
 */
export function buildSearchIndex(workspace: Workspace): SearchRecord[] {
  const modelName = new Map(workspace.models.map((m) => [m.id, m.name]));
  const records: SearchRecord[] = [];

  for (const tool of workspace.tools) {
    records.push({
      id: tool.id,
      type: "tool",
      title: tool.name,
      subtitle: tool.description,
      keywords: [tool.category, tool.provider, tool.status, ...tool.tags, tool.notes].join(" "),
      href: `/tools?tool=${tool.id}`,
      boost: (tool.favorite ? 24 : 0) + Math.min(30, tool.usage30d / 10),
      meta: tool.status,
      favorite: tool.favorite,
    });
  }

  for (const model of workspace.models) {
    records.push({
      id: model.id,
      type: "model",
      title: model.name,
      subtitle: model.notes,
      keywords: [model.family, model.provider, ...model.tags, ...model.modalities].join(" "),
      href: `/models?model=${model.id}`,
      boost: (model.favorite ? 24 : 0) + (model.personalScore ?? 0) * 2,
      meta: model.family,
      favorite: model.favorite,
    });
  }

  for (const prompt of workspace.prompts) {
    records.push({
      id: prompt.id,
      type: "prompt",
      title: prompt.title,
      subtitle: prompt.description,
      keywords: [
        prompt.category,
        ...prompt.tags,
        ...prompt.variables.map((v) => v.name),
        ...prompt.modelIds.map((id) => modelName.get(id) ?? ""),
        prompt.body,
      ].join(" "),
      href: `/prompts?prompt=${prompt.id}`,
      boost: (prompt.favorite ? 24 : 0) + Math.min(40, prompt.useCount / 3),
      meta: prompt.category,
      favorite: prompt.favorite,
    });
  }

  for (const project of workspace.projects) {
    records.push({
      id: project.id,
      type: "project",
      title: project.name,
      subtitle: project.description,
      keywords: [
        project.code,
        project.status,
        ...project.tags,
        ...project.objectives,
        ...project.tasks.map((t) => t.title),
        project.notes,
      ].join(" "),
      href: `/projects/${project.id}`,
      boost: project.status === "active" ? 20 : 0,
      meta: project.code,
    });
  }

  for (const workflow of workspace.workflows) {
    records.push({
      id: workflow.id,
      type: "workflow",
      title: workflow.name,
      subtitle: workflow.description,
      keywords: [
        workflow.status,
        ...workflow.tags,
        ...workflow.nodes.map((n) => `${n.title} ${n.subtitle}`),
      ].join(" "),
      href: `/workflows?workflow=${workflow.id}`,
      boost: workflow.status === "ready" ? 16 : 0,
      meta: workflow.status,
    });
  }

  return records;
}

/**
 * Predicate for list-page filtering.
 *
 * The palette wants fuzzy subsequence matching because its job is to rank.
 * A list filter's job is to exclude, and subsequence matching excludes almost
 * nothing — typing "cursor" would leave 14 of 16 tools on screen. So here every
 * whitespace-separated token must appear as a substring somewhere in the
 * record, which is what people actually expect from a filter box.
 */
export function matchesQuery(query: string, ...fields: Array<string | undefined | null>): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

export interface SearchOptions {
  limit?: number;
  types?: EntityType[];
}

export function searchRecords(
  records: SearchRecord[],
  query: string,
  options: SearchOptions = {},
): SearchHit[] {
  const { limit = 30, types } = options;
  const pool = types?.length ? records.filter((r) => types.includes(r.type)) : records;

  if (!query.trim()) {
    return [...pool]
      .sort((a, b) => b.boost - a.boost || a.title.localeCompare(b.title))
      .slice(0, limit)
      .map((r) => ({ ...r, score: r.boost, positions: [] }));
  }

  const hits: SearchHit[] = [];
  for (const record of pool) {
    // Titles match fuzzily — that is what makes a palette feel fast, and it is
    // where the highlight lands. Everything else must contain the query as a
    // substring: subsequence matching over a record's whole body text will
    // happily "find" any word in any long paragraph.
    const title = fuzzyMatch(query, record.title);
    const body = matchesQuery(query, record.subtitle, record.keywords)
      ? (fuzzyMatch(query, `${record.subtitle} ${record.keywords}`)?.score ?? 1)
      : null;

    if (!title && body === null) continue;
    const score = Math.max(title ? title.score : 0, body !== null ? body * 0.3 : 0);
    hits.push({ ...record, score: score + record.boost, positions: title?.positions ?? [] });
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

/**
 * Groups hits by entity type.
 *
 * Groups are ordered by their strongest hit, not by a fixed type order: the
 * palette activates whatever is first on Enter, so the best overall match has
 * to lead. Within a group, relevance order is preserved.
 */
export function groupHits(hits: SearchHit[]): Array<{ type: EntityType; label: string; hits: SearchHit[] }> {
  const groups = new Map<EntityType, SearchHit[]>();
  for (const hit of hits) {
    const list = groups.get(hit.type);
    if (list) list.push(hit);
    else groups.set(hit.type, [hit]);
  }
  return [...groups.entries()]
    .map(([type, groupHits]) => ({ type, label: TYPE_LABELS[type], hits: groupHits }))
    .sort((a, b) => (b.hits[0]?.score ?? 0) - (a.hits[0]?.score ?? 0));
}
