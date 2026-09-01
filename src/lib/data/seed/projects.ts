import type { Project } from "../types";

type SeedProject = Omit<Project, "createdAt" | "updatedAt" | "dueDate" | "tasks"> & {
  createdDaysAgo: number;
  updatedDaysAgo: number;
  dueInDays: number | null;
  taskList: Array<{ title: string; done: boolean; dueInDays: number | null }>;
};

export const SEED_PROJECTS: SeedProject[] = [
  {
    id: "pr-atlas",
    name: "Atlas — knowledge base search",
    code: "ATL",
    description:
      "Replace the internal wiki's keyword search with a retrieval layer that answers questions instead of returning ten documents. Runs against 14k pages of engineering and support docs.",
    status: "active",
    objectives: [
      "Answer 80% of support questions without opening a document",
      "Keep p95 answer latency under 2.5s",
      "Cite the source paragraph for every claim, or refuse",
      "Cost per answer below $0.02 at 5k answers/day",
    ],
    promptIds: ["p-doc-analysis", "p-code-review"],
    toolIds: ["t-anthropic-api", "t-openai-api", "t-cursor", "t-claude"],
    modelIds: ["m-claude-sonnet-45", "m-claude-haiku-45", "m-gpt-51-mini"],
    notes:
      "Reranking with Haiku beat the embedding-only baseline by a wide margin on the eval set — worth the extra 180ms. Chunking is still the weakest link: tables get shredded.",
    budget: 320,
    series: 1,
    tags: ["rag", "search", "production"],
    createdDaysAgo: 96,
    updatedDaysAgo: 0,
    dueInDays: 24,
    taskList: [
      { title: "Ship the paragraph-level citation UI", done: false, dueInDays: 6 },
      { title: "Fix table chunking — currently split mid-row", done: false, dueInDays: 11 },
      { title: "Move reranking to the Batch API for the nightly reindex", done: false, dueInDays: 18 },
      { title: "Golden eval set — 200 real support questions", done: true, dueInDays: null },
      { title: "Swap embeddings to the 3-large model and re-measure", done: true, dueInDays: null },
      { title: "Prompt caching on the system preamble", done: true, dueInDays: null },
      { title: "Load test at 5k answers/day", done: false, dueInDays: 21 },
    ],
  },
  {
    id: "pr-signal",
    name: "Signal — weekly market brief",
    code: "SIG",
    description:
      "An automated Monday brief on what moved in the AI tooling market: launches, pricing changes, notable shutdowns. Researched, drafted, fact-checked and published without manual assembly.",
    status: "active",
    objectives: [
      "Publish every Monday 07:00 with zero manual steps",
      "Every claim carries a source link that resolves",
      "Under $4 per issue",
    ],
    promptIds: ["p-doc-analysis", "p-audience-rewrite", "p-changelog"],
    toolIds: ["t-perplexity", "t-claude", "t-anthropic-api", "t-elevenlabs"],
    modelIds: ["m-claude-opus-45", "m-claude-sonnet-45"],
    notes:
      "The fact-check pass is non-negotiable — it caught three hallucinated funding rounds in the first month. Audio version gets more engagement than the written one, which was not the plan.",
    budget: 60,
    series: 2,
    tags: ["automation", "content", "weekly"],
    createdDaysAgo: 148,
    updatedDaysAgo: 2,
    dueInDays: null,
    taskList: [
      { title: "Add a pricing-change watcher for the top 12 providers", done: false, dueInDays: 9 },
      { title: "Cut the research step from 6 to 3 queries", done: false, dueInDays: 14 },
      { title: "Audio digest via ElevenLabs", done: true, dueInDays: null },
      { title: "Fact-check pass with source verification", done: true, dueInDays: null },
      { title: "Move publishing to a scheduled job", done: true, dueInDays: null },
    ],
  },
  {
    id: "pr-northstar",
    name: "Northstar — Q2 brand refresh",
    code: "NST",
    description:
      "Full visual identity pass ahead of the Q2 launch: concept direction, key art, motion tests and a voiceover-led product film.",
    status: "paused",
    objectives: [
      "One coherent visual language across web, deck and film",
      "Key art set usable at 1:1 through 21:9 without re-shooting",
      "Deliver before the Q2 launch window opens",
    ],
    promptIds: ["p-shot-list", "p-landing-copy"],
    toolIds: ["t-midjourney", "t-runway", "t-elevenlabs", "t-chatgpt"],
    modelIds: ["m-gpt-51", "m-gemini-3-pro"],
    notes:
      "Paused pending the positioning decision — no point generating another 400 images before we know whether we are selling calm or selling speed. Style reference from the third batch is the one to build on.",
    budget: 180,
    series: 7,
    tags: ["brand", "design", "q2"],
    createdDaysAgo: 71,
    updatedDaysAgo: 19,
    dueInDays: 62,
    taskList: [
      { title: "Lock the positioning angle before generating more art", done: false, dueInDays: 8 },
      { title: "Motion tests for the hero sequence", done: false, dueInDays: null },
      { title: "Concept direction — three routes", done: true, dueInDays: null },
      { title: "Key art batch 3 with style references", done: true, dueInDays: null },
    ],
  },
  {
    id: "pr-ledger",
    name: "Ledger — spend instrumentation",
    code: "LDG",
    description:
      "Get real visibility into AI spend: per-request cost attribution across every provider, tagged by project, surfaced before the invoice arrives rather than after.",
    status: "active",
    objectives: [
      "Attribute 95% of usage spend to a project",
      "Alert when a project passes 80% of its monthly budget",
      "Reconcile against the provider invoice within 2%",
    ],
    promptIds: ["p-sql-explain"],
    toolIds: ["t-anthropic-api", "t-openai-api", "t-google-api", "t-cursor"],
    modelIds: ["m-claude-sonnet-45", "m-deepseek-v32"],
    notes:
      "Attribution is at 91% — the gap is all ad-hoc console usage that carries no project tag. Considering a default-project fallback rather than chasing it.",
    budget: 45,
    series: 5,
    tags: ["internal", "finops", "observability"],
    createdDaysAgo: 54,
    updatedDaysAgo: 1,
    dueInDays: 33,
    taskList: [
      { title: "Budget-threshold alerting at 80% and 100%", done: false, dueInDays: 7 },
      { title: "Reconciliation job against provider invoices", done: false, dueInDays: 20 },
      { title: "Default-project fallback for untagged usage", done: false, dueInDays: null },
      { title: "Per-request cost logging middleware", done: true, dueInDays: null },
      { title: "Provider usage-API ingestion for all three", done: true, dueInDays: null },
    ],
  },
  {
    id: "pr-harbor",
    name: "Harbor — support triage agent",
    code: "HBR",
    description:
      "Front-line triage for inbound support: classify, route, draft a reply, and escalate anything it is not confident about. Shipped to production, now in the tuning phase.",
    status: "shipped",
    objectives: [
      "Correctly route 90% of tickets without a human",
      "Never send a reply on a billing or security ticket",
      "Median first-response under 4 minutes",
    ],
    promptIds: ["p-meeting-actions", "p-audience-rewrite"],
    toolIds: ["t-anthropic-api", "t-claude"],
    modelIds: ["m-claude-haiku-45", "m-claude-sonnet-45"],
    notes:
      "Routing accuracy sits at 93%. The hard-block on billing and security categories has held for eleven weeks with no escapes. Haiku handles classification; Sonnet drafts.",
    budget: 90,
    series: 6,
    tags: ["support", "agent", "shipped"],
    createdDaysAgo: 210,
    updatedDaysAgo: 8,
    dueInDays: null,
    taskList: [
      { title: "Tune the confidence threshold — too many escalations", done: false, dueInDays: 12 },
      { title: "Quarterly accuracy audit", done: false, dueInDays: 30 },
      { title: "Hard block on billing and security categories", done: true, dueInDays: null },
      { title: "Draft-reply generation with tone matching", done: true, dueInDays: null },
      { title: "Production rollout at 100%", done: true, dueInDays: null },
      { title: "Shadow mode for two weeks", done: true, dueInDays: null },
    ],
  },
  {
    id: "pr-cartography",
    name: "Cartography — video pipeline",
    code: "CTG",
    description:
      "Automatically generate chapter markers, thumbnails and searchable transcripts for the tutorial library. Currently in scoping.",
    status: "planning",
    objectives: [
      "Chapter every video in the back catalogue (180 hours)",
      "Under $0.30 per video hour",
      "Transcripts searchable from the same index as the docs",
    ],
    promptIds: ["p-doc-analysis"],
    toolIds: ["t-google-api", "t-whisper-local", "t-gemini"],
    modelIds: ["m-gemini-25-flash", "m-gemini-3-pro"],
    notes:
      "Flash on frame batches is the only thing that makes the back catalogue economical. Local Whisper for transcripts — the accented-audio accuracy gap versus the hosted API is significant.",
    budget: 75,
    series: 3,
    tags: ["video", "scoping", "backlog"],
    createdDaysAgo: 21,
    updatedDaysAgo: 4,
    dueInDays: 48,
    taskList: [
      { title: "Cost model for the full 180-hour catalogue", done: false, dueInDays: 5 },
      { title: "Frame sampling strategy — fixed vs scene-change", done: false, dueInDays: 10 },
      { title: "Decide: keep the Gemini subscription or go API-only", done: false, dueInDays: 12 },
      { title: "Benchmark local Whisper vs hosted on 20 samples", done: true, dueInDays: null },
    ],
  },
];
