import type { Duel, DuelEntry, TaskProfile, TaskType } from "../types";
import { SEED_MODELS } from "./models";

/**
 * The seeded evidence corpus.
 *
 * Written as a story spec rather than 66 literal records: each task type
 * declares its matchup and an ordered list of outcomes, and the duels are
 * generated from that. Ordering matters — it is what lets the corpus contain a
 * reversal (a model that used to lose and now wins), which is the behaviour
 * that proves the ledger is live rather than a static benchmark.
 */

export const TASK_TYPES: TaskType[] = [
  "code-review",
  "code-generation",
  "summarisation",
  "classification",
  "long-form-writing",
  "research-synthesis",
  "brainstorming",
  "data-extraction",
];

export const TASK_LABEL: Record<TaskType, string> = {
  "code-review": "Code review",
  "code-generation": "Code generation",
  summarisation: "Summarisation",
  classification: "Classification",
  "long-form-writing": "Long-form writing",
  "research-synthesis": "Research synthesis",
  brainstorming: "Brainstorming",
  "data-extraction": "Data extraction",
};

export const TASK_DESCRIPTION: Record<TaskType, string> = {
  "code-review": "Finding real defects in a diff",
  "code-generation": "Writing code from a specification",
  summarisation: "Condensing a long document",
  classification: "Sorting items into known categories",
  "long-form-writing": "Drafting something someone will read end to end",
  "research-synthesis": "Pulling one answer out of many sources",
  brainstorming: "Generating options worth choosing between",
  "data-extraction": "Pulling structured fields out of messy text",
};

interface Outcome {
  /** Index into `models` for the winner, or -1 for a tie. */
  winner: number;
  daysAgo: number;
  title: string;
  reason: string;
}

interface StorySpec {
  taskType: TaskType;
  models: string[];
  avgTokensIn: number;
  avgTokensOut: number;
  outcomes: Outcome[];
}

const STORY: StorySpec[] = [
  {
    // The flagship finding: the expensive default loses on the work it is
    // most often reached for.
    taskType: "code-review",
    models: ["m-claude-opus-45", "m-claude-sonnet-45"],
    avgTokensIn: 9_200,
    avgTokensOut: 1_400,
    outcomes: [
      { winner: 0, daysAgo: 84, title: "Billing service refund path", reason: "Opus caught the double-refund race; Sonnet missed it entirely." },
      { winner: 1, daysAgo: 77, title: "Auth middleware rewrite", reason: "Same two findings, Sonnet's fix was the smaller one." },
      { winner: 1, daysAgo: 70, title: "Search indexer batching", reason: "Opus padded it with style notes I had explicitly banned." },
      { winner: 1, daysAgo: 61, title: "Webhook retry logic", reason: "Both found the missing idempotency key. Sonnet stopped there." },
      { winner: 0, daysAgo: 52, title: "Migration script for the orders table", reason: "Opus spotted the lock escalation on a 40M-row table." },
      { winner: 1, daysAgo: 41, title: "Rate limiter edge cases", reason: "Identical findings, and Sonnet gave a failing test case." },
      { winner: 1, daysAgo: 30, title: "Session invalidation on password change", reason: "Sonnet found the stale-token window; Opus called it 'consider'." },
      { winner: 1, daysAgo: 24, title: "CSV import validation", reason: "No difference in substance. Cheaper wins the tie-break." },
      { winner: 1, daysAgo: 18, title: "Cache invalidation on the pricing table", reason: "Sonnet found the stale-read window between write and evict." },
      { winner: 1, daysAgo: 11, title: "Error handling in the export job", reason: "Both correct. Sonnet's was three lines shorter." },
      { winner: 1, daysAgo: 6, title: "Feature flag cleanup", reason: "Sonnet was the only one to notice the flag was still read in two places." },
    ],
  },
  {
    // Genuinely close, deliberately left short of confidence.
    taskType: "code-generation",
    models: ["m-claude-sonnet-45", "m-deepseek-v32"],
    avgTokensIn: 3_100,
    avgTokensOut: 1_800,
    outcomes: [
      { winner: 0, daysAgo: 79, title: "Pagination hook with cursor state", reason: "DeepSeek's version dropped the abort controller." },
      { winner: 1, daysAgo: 66, title: "Zod schema from a sample payload", reason: "DeepSeek nailed the optional/nullable distinction first try." },
      { winner: 0, daysAgo: 55, title: "Retry wrapper with jitter", reason: "Sonnet's backoff maths was right; DeepSeek's overflowed." },
      { winner: 1, daysAgo: 43, title: "SQL for the cohort report", reason: "Identical output, DeepSeek in a third of the time." },
      { winner: -1, daysAgo: 34, title: "Debounced search input", reason: "Indistinguishable. Both correct, both idiomatic." },
      { winner: 1, daysAgo: 25, title: "CSV streaming parser", reason: "DeepSeek handled the quoted-newline case unprompted." },
      { winner: 0, daysAgo: 14, title: "Type-safe event emitter", reason: "Generics only Sonnet got right." },
      { winner: 0, daysAgo: 4, title: "Rate-limited queue worker", reason: "DeepSeek's version deadlocked under concurrency." },
    ],
  },
  {
    // A reversal: the leader changes mid-corpus.
    taskType: "summarisation",
    models: ["m-gpt-51", "m-claude-sonnet-45"],
    avgTokensIn: 41_000,
    avgTokensOut: 900,
    outcomes: [
      { winner: 0, daysAgo: 88, title: "Vendor security questionnaire", reason: "GPT-5.1 kept the structure of the original." },
      { winner: 0, daysAgo: 81, title: "Q3 board pack", reason: "Tighter, and it kept every number." },
      { winner: 0, daysAgo: 72, title: "Postmortem thread, 240 messages", reason: "GPT-5.1 found the actual decision point." },
      { winner: 1, daysAgo: 58, title: "Support transcript batch", reason: "Sonnet stopped inventing section headings." },
      { winner: 1, daysAgo: 47, title: "RFC on the ingest rewrite", reason: "Sonnet preserved the dissenting view; GPT flattened it." },
      { winner: 1, daysAgo: 36, title: "Customer interview set", reason: "Attribution held. That is the whole job here." },
      { winner: 1, daysAgo: 24, title: "Compliance policy diff", reason: "Sonnet quoted exactly; GPT paraphrased a legal clause." },
      { winner: 1, daysAgo: 19, title: "Incident channel backscroll", reason: "Clean timeline, no invented times." },
      { winner: 1, daysAgo: 12, title: "Weekly research digest", reason: "Sonnet kept the caveats. GPT dropped them." },
      { winner: 1, daysAgo: 3, title: "Quarterly metrics doc", reason: "Same again. The gap has held for two months." },
    ],
  },
  {
    // The big money: high volume, and the cheap model is indistinguishable.
    taskType: "classification",
    models: ["m-claude-sonnet-45", "m-claude-haiku-45"],
    avgTokensIn: 1_400,
    avgTokensOut: 60,
    outcomes: [
      { winner: 0, daysAgo: 86, title: "Support ticket routing, batch of 50", reason: "Sonnet got the billing/security boundary right twice more." },
      { winner: -1, daysAgo: 80, title: "Intent tagging, 100 messages", reason: "Identical labels on all 100." },
      { winner: 1, daysAgo: 74, title: "Sentiment on review dump", reason: "Haiku was right on the sarcastic ones." },
      { winner: -1, daysAgo: 65, title: "Bug vs feature request", reason: "No disagreement." },
      { winner: 1, daysAgo: 59, title: "Priority triage, 80 tickets", reason: "Haiku, and eight times faster." },
      { winner: 0, daysAgo: 50, title: "Language detection on mixed corpus", reason: "Sonnet handled the code-switching cases." },
      { winner: -1, daysAgo: 44, title: "Topic tagging for the docs index", reason: "Same tags, different order." },
      { winner: 1, daysAgo: 37, title: "Spam vs legitimate signup", reason: "Haiku, no false positives." },
      { winner: 0, daysAgo: 28, title: "Escalation prediction", reason: "Sonnet read the implied urgency better." },
      { winner: 1, daysAgo: 20, title: "Category assignment, 200 items", reason: "Indistinguishable output, a fifth of the cost." },
      { winner: 0, daysAgo: 11, title: "PII detection sweep", reason: "Sonnet caught two Haiku missed. This one matters." },
      { winner: 1, daysAgo: 2, title: "Ticket routing, weekly batch", reason: "Haiku again. The gap only shows up on PII." },
    ],
  },
  {
    // The counterweight: sometimes the expensive model is worth it.
    taskType: "long-form-writing",
    models: ["m-claude-opus-45", "m-gpt-51"],
    avgTokensIn: 6_400,
    avgTokensOut: 3_100,
    outcomes: [
      { winner: 0, daysAgo: 85, title: "Architecture decision record: ingest", reason: "Opus held the argument across 2,000 words." },
      { winner: 0, daysAgo: 76, title: "Launch announcement, long version", reason: "GPT drifted into marketing voice by paragraph four." },
      { winner: 1, daysAgo: 68, title: "Conference talk abstract", reason: "GPT's hook was better and I used it verbatim." },
      { winner: 0, daysAgo: 57, title: "Engineering onboarding guide", reason: "Structure held. GPT repeated itself twice." },
      { winner: 0, daysAgo: 48, title: "Post-incident public writeup", reason: "Opus got the tone right without being asked." },
      { winner: 0, daysAgo: 39, title: "Pricing page rewrite", reason: "Opus, and it flagged a claim we could not support." },
      { winner: 0, daysAgo: 29, title: "Technical deep-dive blog post", reason: "Only Opus kept the code and the prose consistent." },
      { winner: 1, daysAgo: 21, title: "Investor update draft", reason: "GPT was more concise and I did not have to cut it." },
      { winner: 0, daysAgo: 15, title: "Design system documentation", reason: "Opus. Not close." },
      { winner: 0, daysAgo: 8, title: "Migration guide for the v2 API", reason: "Opus kept every step consistent with the one before it." },
      { winner: 0, daysAgo: 1, title: "Roadmap narrative for Q1", reason: "Held the through-line. GPT wrote a list." },
    ],
  },
  {
    // Context window as the deciding factor.
    taskType: "research-synthesis",
    models: ["m-gemini-3-pro", "m-claude-opus-45"],
    avgTokensIn: 184_000,
    avgTokensOut: 2_200,
    outcomes: [
      { winner: 0, daysAgo: 82, title: "Competitor pricing across 40 pages", reason: "Gemini took the whole corpus; Opus needed chunking and lost cross-references." },
      { winner: 0, daysAgo: 69, title: "Regulatory landscape scan", reason: "Same reason. One pass beats six." },
      { winner: 1, daysAgo: 56, title: "Three papers on retrieval eval", reason: "Opus was sharper on what the papers actually claimed." },
      { winner: 0, daysAgo: 42, title: "Year of changelogs, 12 providers", reason: "Gemini, comfortably. This is what the 1M window is for." },
      { winner: 0, daysAgo: 31, title: "Support corpus for recurring themes", reason: "Gemini held every ticket in context." },
      { winner: 1, daysAgo: 17, title: "Two vendor contracts compared", reason: "Opus caught the indemnity asymmetry." },
      { winner: 0, daysAgo: 5, title: "Full docs site audit", reason: "Gemini. Chunking loses the point on this task." },
    ],
  },
  {
    taskType: "brainstorming",
    models: ["m-gpt-51", "m-claude-opus-45"],
    avgTokensIn: 1_200,
    avgTokensOut: 2_600,
    outcomes: [
      { winner: 0, daysAgo: 83, title: "Names for the routing feature", reason: "GPT gave twenty, three were usable. Opus gave six polished ones." },
      { winner: 0, daysAgo: 71, title: "Onboarding step ideas", reason: "GPT's range was wider and range is the point here." },
      { winner: 1, daysAgo: 60, title: "Ways to cut inference cost", reason: "Opus's list was shorter and every item was real." },
      { winner: 0, daysAgo: 51, title: "Blog post angles", reason: "GPT. Volume wins when I am the filter." },
      { winner: 0, daysAgo: 40, title: "Failure modes for the triage agent", reason: "GPT found three I had not considered." },
      { winner: 1, daysAgo: 32, title: "Pricing model options", reason: "Opus reasoned about each one's consequence." },
      { winner: 0, daysAgo: 22, title: "Email subject lines", reason: "GPT, obviously. Quantity task." },
      { winner: 0, daysAgo: 13, title: "Positioning statements", reason: "GPT gave more genuinely different angles." },
      { winner: 1, daysAgo: 7, title: "Metrics worth tracking", reason: "Opus questioned two of my premises. That was the value." },
    ],
  },
  {
    // Deliberately thin: the product has to be honest about not knowing.
    taskType: "data-extraction",
    models: ["m-claude-haiku-45", "m-gpt-51-mini"],
    avgTokensIn: 2_800,
    avgTokensOut: 420,
    outcomes: [
      { winner: 0, daysAgo: 26, title: "Invoice fields from PDFs", reason: "Haiku got the dates right; mini flipped two to US format." },
      { winner: 0, daysAgo: 9, title: "Contact details from email footers", reason: "Haiku again, but two runs is not evidence." },
    ],
  },
];

/**
 * Volume and current defaults.
 *
 * A verdict is only worth money once you know how often you run that kind of
 * work — "Haiku wins classification" means nothing until you know it is 12,000
 * runs a month. Estimated by the user today; read from usage APIs later.
 */
export const SEED_TASK_PROFILES: TaskProfile[] = [
  { taskType: "classification", currentModelId: "m-claude-sonnet-45", runsPerMonth: 12_000, avgTokensIn: 1_400, avgTokensOut: 60 },
  { taskType: "code-generation", currentModelId: "m-claude-sonnet-45", runsPerMonth: 620, avgTokensIn: 3_100, avgTokensOut: 1_800 },
  { taskType: "code-review", currentModelId: "m-claude-opus-45", runsPerMonth: 210, avgTokensIn: 9_200, avgTokensOut: 1_400 },
  { taskType: "summarisation", currentModelId: "m-gpt-51", runsPerMonth: 180, avgTokensIn: 41_000, avgTokensOut: 900 },
  { taskType: "data-extraction", currentModelId: "m-gpt-51-mini", runsPerMonth: 340, avgTokensIn: 2_800, avgTokensOut: 420 },
  { taskType: "research-synthesis", currentModelId: "m-claude-opus-45", runsPerMonth: 22, avgTokensIn: 184_000, avgTokensOut: 2_200 },
  { taskType: "long-form-writing", currentModelId: "m-claude-opus-45", runsPerMonth: 45, avgTokensIn: 6_400, avgTokensOut: 3_100 },
  { taskType: "brainstorming", currentModelId: "m-gpt-51", runsPerMonth: 70, avgTokensIn: 1_200, avgTokensOut: 2_600 },
];

const PROMPT_FOR_TASK: Partial<Record<TaskType, string>> = {
  "code-review": "p-code-review",
  summarisation: "p-doc-analysis",
  "long-form-writing": "p-audience-rewrite",
  "research-synthesis": "p-user-interview",
};

const PROJECT_FOR_TASK: Partial<Record<TaskType, string>> = {
  "code-review": "pr-atlas",
  classification: "pr-harbor",
  summarisation: "pr-signal",
  "research-synthesis": "pr-signal",
  "code-generation": "pr-atlas",
};

/** Deterministic jitter so token counts vary without the corpus drifting. */
function jitter(seed: number, spread: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return 1 + ((x - Math.floor(x)) - 0.5) * spread;
}

function entryFor(modelId: string, spec: StorySpec, seed: number): DuelEntry {
  const model = SEED_MODELS.find((m) => m.id === modelId)!;
  const tokensIn = Math.round(spec.avgTokensIn * jitter(seed, 0.35));
  const tokensOut = Math.round(spec.avgTokensOut * jitter(seed + 7, 0.45));
  return {
    modelId,
    output: "",
    tokensIn,
    tokensOut,
    latencyMs: Math.round(model.latencyMs + (tokensOut / model.throughput) * 1000),
    cost:
      Math.round(
        ((tokensIn / 1_000_000) * model.inputPrice + (tokensOut / 1_000_000) * model.outputPrice) *
          1_000_000,
      ) / 1_000_000,
  };
}

export function generateDuels(now: Date): Duel[] {
  const duels: Duel[] = [];
  let seq = 0;

  for (const spec of STORY) {
    spec.outcomes.forEach((outcome, index) => {
      const at = new Date(now.getTime() - outcome.daysAgo * 86_400_000);
      // Judged a little after it was run, the way it actually happens.
      const decided = new Date(at.getTime() + (12 + (index % 5) * 9) * 60_000);
      duels.push({
        id: `d-${spec.taskType}-${index}`,
        title: outcome.title,
        taskType: spec.taskType,
        createdAt: at.toISOString(),
        decidedAt: decided.toISOString(),
        status: "decided",
        promptId: PROMPT_FOR_TASK[spec.taskType] ?? null,
        projectId: PROJECT_FOR_TASK[spec.taskType] ?? null,
        entries: spec.models.map((id) => entryFor(id, spec, seq++)),
        winnerModelId: outcome.winner === -1 ? null : spec.models[outcome.winner]!,
        tie: outcome.winner === -1,
        reason: outcome.reason,
        blind: true,
        sample: true,
      });
    });
  }

  // Two open duels, so the app always has something waiting for a verdict —
  // the pending queue is what brings someone back tomorrow.
  const pendingSpecs: Array<{ spec: StorySpec; title: string; hoursAgo: number }> = [
    { spec: STORY[0]!, title: "Payment webhook signature check", hoursAgo: 5 },
    { spec: STORY[4]!, title: "Changelog for the routing release", hoursAgo: 27 },
  ];

  for (const [index, { spec, title, hoursAgo }] of pendingSpecs.entries()) {
    const at = new Date(now.getTime() - hoursAgo * 3_600_000);
    duels.push({
      id: `d-pending-${index}`,
      title,
      taskType: spec.taskType,
      createdAt: at.toISOString(),
      decidedAt: null,
      status: "pending",
      promptId: PROMPT_FOR_TASK[spec.taskType] ?? null,
      projectId: PROJECT_FOR_TASK[spec.taskType] ?? null,
      entries: spec.models.map((id) => entryFor(id, spec, seq++)),
      winnerModelId: null,
      tie: false,
      reason: "",
      blind: true,
      sample: true,
    });
  }

  return duels.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
