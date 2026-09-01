/**
 * Deterministic generators for the time-series parts of the seed workspace.
 *
 * Spend and activity are generated rather than hand-written so that the app
 * always shows ~13 months of plausible history relative to the day it is
 * opened. The PRNG is seeded, so the same reference date always produces the
 * same workspace — which is what makes the financial tests assertable.
 */

import type {
  ActivityEvent,
  ActivityKind,
  ProviderId,
  SpendCategory,
  SpendEntry,
  SpendKind,
} from "../types";
import { SEED_TOOLS } from "./tools";

/** mulberry32 — small, fast, good enough for plausible-looking noise. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Local-calendar YYYY-MM-DD. Avoids the UTC off-by-one that toISOString gives. */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const HISTORY_DAYS = 400;

interface SubscriptionPlan {
  toolId: string;
  provider: ProviderId;
  category: SpendCategory;
  amount: number;
  billingDay: number;
  /** Days ago the subscription started. */
  startsDaysAgo: number;
  /** Days ago the subscription stopped, or null if still running. */
  endsDaysAgo: number | null;
  projectId: string | null;
  label: string;
}

const SUBSCRIPTIONS: SubscriptionPlan[] = [
  { toolId: "t-claude", provider: "anthropic", category: "assistant", amount: 20, billingDay: 12, startsDaysAgo: 402, endsDaysAgo: null, projectId: null, label: "Claude Pro" },
  { toolId: "t-chatgpt", provider: "openai", category: "assistant", amount: 20, billingDay: 5, startsDaysAgo: 400, endsDaysAgo: null, projectId: null, label: "ChatGPT Plus" },
  { toolId: "t-cursor", provider: "cursor", category: "coding", amount: 20, billingDay: 19, startsDaysAgo: 311, endsDaysAgo: null, projectId: null, label: "Cursor Pro" },
  { toolId: "t-copilot", provider: "github", category: "coding", amount: 10, billingDay: 22, startsDaysAgo: 400, endsDaysAgo: null, projectId: null, label: "GitHub Copilot" },
  { toolId: "t-perplexity", provider: "perplexity", category: "research", amount: 20, billingDay: 8, startsDaysAgo: 245, endsDaysAgo: null, projectId: "pr-signal", label: "Perplexity Pro" },
  { toolId: "t-midjourney", provider: "midjourney", category: "image", amount: 30, billingDay: 26, startsDaysAgo: 400, endsDaysAgo: null, projectId: "pr-northstar", label: "Midjourney Standard" },
  { toolId: "t-elevenlabs", provider: "elevenlabs", category: "audio", amount: 22, billingDay: 15, startsDaysAgo: 168, endsDaysAgo: null, projectId: "pr-signal", label: "ElevenLabs Creator" },
  { toolId: "t-notion", provider: "other", category: "assistant", amount: 10, billingDay: 3, startsDaysAgo: 52, endsDaysAgo: null, projectId: null, label: "Notion AI" },
  { toolId: "t-gemini", provider: "google", category: "assistant", amount: 19.99, billingDay: 12, startsDaysAgo: 18, endsDaysAgo: null, projectId: "pr-cartography", label: "Google AI Pro" },
  { toolId: "t-runway", provider: "runway", category: "video", amount: 35, billingDay: 9, startsDaysAgo: 190, endsDaysAgo: 41, projectId: "pr-northstar", label: "Runway Standard" },
  { toolId: "t-v0", provider: "other", category: "coding", amount: 20, billingDay: 17, startsDaysAgo: 260, endsDaysAgo: 74, projectId: null, label: "v0 Premium" },
  { toolId: "t-raycast", provider: "other", category: "productivity", amount: 96, billingDay: 6, startsDaysAgo: 430, endsDaysAgo: null, projectId: null, label: "Raycast Pro (annual)" },
];

interface UsageStream {
  toolId: string;
  provider: ProviderId;
  category: SpendCategory;
  modelId: string;
  /** Baseline USD/day at the start of the window. */
  base: number;
  /** Multiplier applied linearly across the window — the growth story. */
  growth: number;
  startsDaysAgo: number;
  projectWeights: Array<[string, number]>;
  label: string;
  /** Rough USD per 1M tokens blended, used to back out plausible token counts. */
  blendedRate: number;
}

const USAGE_STREAMS: UsageStream[] = [
  {
    toolId: "t-anthropic-api",
    provider: "anthropic",
    category: "api",
    modelId: "m-claude-sonnet-45",
    base: 1.6,
    growth: 3.4,
    startsDaysAgo: 358,
    projectWeights: [["pr-atlas", 0.46], ["pr-harbor", 0.24], ["pr-signal", 0.17], ["pr-ledger", 0.08], [null as unknown as string, 0.05]],
    label: "Messages API",
    blendedRate: 7.2,
  },
  {
    toolId: "t-openai-api",
    provider: "openai",
    category: "api",
    modelId: "m-gpt-51-mini",
    base: 0.9,
    growth: 2.1,
    startsDaysAgo: 390,
    projectWeights: [["pr-atlas", 0.62], ["pr-harbor", 0.12], ["pr-ledger", 0.06], [null as unknown as string, 0.2]],
    label: "Embeddings + transcription",
    blendedRate: 1.1,
  },
  {
    toolId: "t-google-api",
    provider: "google",
    category: "api",
    modelId: "m-gemini-25-flash",
    base: 0.15,
    growth: 6.5,
    startsDaysAgo: 96,
    projectWeights: [["pr-cartography", 0.83], [null as unknown as string, 0.17]],
    label: "Gemini Flash — frame analysis",
    blendedRate: 1.4,
  },
];

function pickWeighted(weights: Array<[string, number]>, r: number): string | null {
  let acc = 0;
  for (const [key, w] of weights) {
    acc += w;
    if (r <= acc) return key ?? null;
  }
  return weights[weights.length - 1]?.[0] ?? null;
}

/** Weekday rhythm: quiet weekends, a Tuesday/Wednesday peak. */
function weekdayFactor(day: number): number {
  return [0.34, 1.06, 1.18, 1.14, 1.02, 0.88, 0.28][day] ?? 1;
}

export function generateSpend(now: Date): SpendEntry[] {
  const rng = makeRng(0x5eed_1a7e);
  const entries: SpendEntry[] = [];
  let seq = 0;

  for (let offset = HISTORY_DAYS; offset >= 0; offset--) {
    const date = addDays(now, -offset);
    const dayKey = toDayKey(date);
    const dom = date.getDate();
    const progress = (HISTORY_DAYS - offset) / HISTORY_DAYS;

    for (const sub of SUBSCRIPTIONS) {
      if (offset > sub.startsDaysAgo) continue;
      if (sub.endsDaysAgo !== null && offset < sub.endsDaysAgo) continue;
      if (dom !== sub.billingDay) continue;
      // Annual plans only bill on the anniversary month.
      if (sub.amount === 96 && date.getMonth() !== 2) continue;
      entries.push({
        id: `s-${seq++}`,
        date: dayKey,
        provider: sub.provider,
        toolId: sub.toolId,
        projectId: sub.projectId,
        modelId: null,
        category: sub.category,
        kind: "subscription",
        amount: sub.amount,
        description: sub.label,
        tokensIn: null,
        tokensOut: null,
      });
    }

    for (const stream of USAGE_STREAMS) {
      if (offset > stream.startsDaysAgo) continue;
      const streamProgress = Math.min(
        1,
        (stream.startsDaysAgo - offset) / Math.max(1, stream.startsDaysAgo),
      );
      const trend = 1 + (stream.growth - 1) * streamProgress;
      const noise = 0.62 + rng() * 0.78;
      const amount = stream.base * trend * weekdayFactor(date.getDay()) * noise;
      if (amount < 0.02) continue;
      const rounded = Math.round(amount * 100) / 100;
      const tokens = (rounded / stream.blendedRate) * 1_000_000;
      entries.push({
        id: `s-${seq++}`,
        date: dayKey,
        provider: stream.provider,
        toolId: stream.toolId,
        projectId: pickWeighted(stream.projectWeights, rng()),
        modelId: stream.modelId,
        category: stream.category,
        kind: "usage",
        amount: rounded,
        description: stream.label,
        tokensIn: Math.round(tokens * 0.82),
        tokensOut: Math.round(tokens * 0.18),
      });
    }

    // Occasional one-off top-ups and the odd refund, to make the ledger feel real.
    if (rng() < 0.014 && progress > 0.2) {
      entries.push({
        id: `s-${seq++}`,
        date: dayKey,
        provider: "midjourney",
        toolId: "t-midjourney",
        projectId: "pr-northstar",
        modelId: null,
        category: "image",
        kind: "one-off",
        amount: 8,
        description: "Fast-hours top-up",
        tokensIn: null,
        tokensOut: null,
      });
    }
    if (rng() < 0.004 && offset > 40) {
      entries.push({
        id: `s-${seq++}`,
        date: dayKey,
        provider: "openai",
        toolId: "t-openai-api",
        projectId: null,
        modelId: null,
        category: "api",
        kind: "credit",
        amount: -Math.round((3 + rng() * 12) * 100) / 100,
        description: "Service credit",
        tokensIn: null,
        tokensOut: null,
      });
    }
  }

  return entries;
}

interface ActivityTemplate {
  kind: ActivityKind;
  title: string;
  detail: string;
  entityType: ActivityEvent["entityType"];
  entityId: string | null;
  cost: number | null;
  /** Relative likelihood of being picked for a slot. */
  weight: number;
}

const ACTIVITY_POOL: ActivityTemplate[] = [
  { kind: "prompt.run", title: "Ran Meeting transcript to decisions", detail: "Weekly product sync · Claude Haiku 4.5 · 1,412 tokens", entityType: "prompt", entityId: "p-meeting-actions", cost: 0.007, weight: 9 },
  { kind: "prompt.run", title: "Ran Adversarial code review", detail: "Billing service diff · Claude Opus 4.5 · 8,204 tokens", entityType: "prompt", entityId: "p-code-review", cost: 0.246, weight: 8 },
  { kind: "prompt.run", title: "Ran Rewrite for a specific audience", detail: "Atlas launch note · Claude Sonnet 4.5", entityType: "prompt", entityId: "p-audience-rewrite", cost: 0.031, weight: 8 },
  { kind: "prompt.run", title: "Ran Structured document analysis", detail: "Vendor security questionnaire · Gemini 3 Pro · 41k tokens", entityType: "prompt", entityId: "p-doc-analysis", cost: 0.118, weight: 6 },
  { kind: "prompt.run", title: "Ran Head-to-head model evaluation", detail: "Sonnet 4.5 vs DeepSeek-V3.2 on refactor tasks", entityType: "prompt", entityId: "p-model-eval", cost: 0.084, weight: 5 },
  { kind: "prompt.run", title: "Ran Image prompt from a brief", detail: "Northstar key art · 4 variants", entityType: "prompt", entityId: "p-shot-list", cost: 0.022, weight: 4 },
  { kind: "workflow.run", title: "Atlas answer pipeline completed", detail: "1,204 answers · p95 2.31s · 7.1% fell back to search", entityType: "workflow", entityId: "w-atlas-answer", cost: 16.84, weight: 7 },
  { kind: "workflow.run", title: "Support triage completed", detail: "312 tickets · 93% routed · 21 escalated", entityType: "workflow", entityId: "w-support-triage", cost: 1.87, weight: 6 },
  { kind: "workflow.run", title: "Weekly market brief published", detail: "Issue #21 · fact-check flagged 1 claim · audio digest attached", entityType: "workflow", entityId: "w-signal-brief", cost: 3.42, weight: 3 },
  { kind: "project.updated", title: "Atlas — knowledge base search", detail: "Closed: prompt caching on the system preamble", entityType: "project", entityId: "pr-atlas", cost: null, weight: 5 },
  { kind: "project.updated", title: "Ledger — spend instrumentation", detail: "Attribution coverage moved 87% → 91%", entityType: "project", entityId: "pr-ledger", cost: null, weight: 4 },
  { kind: "project.updated", title: "Harbor — support triage agent", detail: "Confidence threshold lowered to 0.82 for a two-week trial", entityType: "project", entityId: "pr-harbor", cost: null, weight: 3 },
  { kind: "model.scored", title: "Scored DeepSeek-V3.2", detail: "8.3 — output price is 1/35th of Opus on small diffs", entityType: "model", entityId: "m-deepseek-v32", cost: null, weight: 3 },
  { kind: "model.scored", title: "Scored Gemini 3 Pro", detail: "8.7 — unbeaten on video, formatting still drifts", entityType: "model", entityId: "m-gemini-3-pro", cost: null, weight: 2 },
  { kind: "prompt.updated", title: "Updated Adversarial code review", detail: "Banned style comments — they were drowning the real findings", entityType: "prompt", entityId: "p-code-review", cost: null, weight: 3 },
  { kind: "prompt.created", title: "Created Blameless incident timeline", detail: "Built from the search-index outage retro", entityType: "prompt", entityId: "p-incident-postmortem", cost: null, weight: 2 },
  { kind: "tool.status", title: "Paused Runway", detail: "Northstar launch video shipped — resume for the Q2 campaign", entityType: "tool", entityId: "t-runway", cost: null, weight: 2 },
  { kind: "tool.added", title: "Started Gemini trial", detail: "Evaluating the 1M-token window for the video pipeline", entityType: "tool", entityId: "t-gemini", cost: null, weight: 2 },
  { kind: "spend.recorded", title: "Anthropic API usage settled", detail: "Batch reindex — 4.2M tokens through the Batch API", entityType: "spend", entityId: null, cost: 18.4, weight: 4 },
  { kind: "budget.alert", title: "Cartography passed 80% of its budget", detail: "$61.20 of $75 with 9 days left in the month", entityType: "project", entityId: "pr-cartography", cost: null, weight: 1 },
];

export function generateActivity(now: Date, count = 64): ActivityEvent[] {
  const rng = makeRng(0xac71_1a17);
  const totalWeight = ACTIVITY_POOL.reduce((sum, t) => sum + t.weight, 0);
  const events: ActivityEvent[] = [];
  // Walk backwards from now, spacing events by a few hours with jitter.
  let cursor = now.getTime() - 1000 * 60 * 24;

  for (let i = 0; i < count; i++) {
    let r = rng() * totalWeight;
    let picked = ACTIVITY_POOL[0];
    for (const template of ACTIVITY_POOL) {
      r -= template.weight;
      if (r <= 0) {
        picked = template;
        break;
      }
    }
    const t = picked!;
    events.push({
      id: `a-${i}`,
      at: new Date(cursor).toISOString(),
      kind: t.kind,
      title: t.title,
      detail: t.detail,
      entityType: t.entityType,
      entityId: t.entityId,
      cost: t.cost,
    });
    // Denser in the last few days, sparser further back.
    const gapHours = 1.5 + rng() * (i < 12 ? 5 : i < 30 ? 14 : 30);
    cursor -= gapHours * 60 * 60 * 1000;
  }

  return events;
}

export const SPEND_HISTORY_DAYS = HISTORY_DAYS;
