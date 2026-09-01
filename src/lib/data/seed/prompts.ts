import type { Prompt } from "../types";

type SeedPrompt = Omit<Prompt, "createdAt" | "updatedAt" | "lastUsedAt" | "versions"> & {
  createdDaysAgo: number;
  updatedDaysAgo: number;
  lastUsedDaysAgo: number | null;
  versionHistory: Array<{ daysAgo: number; note: string; body: string }>;
};

export const SEED_PROMPTS: SeedPrompt[] = [
  {
    id: "p-audience-rewrite",
    title: "Rewrite for a specific audience",
    description: "Takes a draft and re-pitches it at one named reader without flattening the argument.",
    body: `You are rewriting the text below for a specific reader.

READER: {{audience}}
TONE: {{tone}}
TARGET LENGTH: {{length}}

Rules:
- Keep every load-bearing claim. Cut hedging, not substance.
- Replace jargon the reader would not use themselves.
- Lead with the conclusion, then the reasoning.
- If a claim needs evidence the text does not provide, mark it [needs source] rather than inventing one.

Return only the rewritten text.

---
{{draft}}`,
    category: "writing",
    tags: ["editing", "tone", "reusable"],
    variables: [
      { name: "audience", label: "Audience", description: "Who is reading this, specifically.", type: "text", defaultValue: "A senior engineer who has never seen this codebase" },
      { name: "tone", label: "Tone", description: "", type: "select", defaultValue: "Direct and technical", options: ["Direct and technical", "Warm and plain", "Formal", "Persuasive", "Neutral / documentation"] },
      { name: "length", label: "Target length", description: "", type: "select", defaultValue: "Roughly the same length", options: ["Half as long", "Roughly the same length", "Expand with detail", "Under 150 words"] },
      { name: "draft", label: "Draft", description: "The text to rewrite.", type: "longtext", defaultValue: "" },
    ],
    favorite: true,
    useCount: 142,
    modelIds: ["m-claude-sonnet-45", "m-gpt-51"],
    createdDaysAgo: 214,
    updatedDaysAgo: 11,
    lastUsedDaysAgo: 0,
    versionHistory: [
      { daysAgo: 214, note: "First version", body: "Rewrite the following for {{audience}} in a {{tone}} tone.\n\n{{draft}}" },
      { daysAgo: 96, note: "Added the [needs source] rule after it invented a statistic", body: "Rewrite for {{audience}}, tone {{tone}}.\nDo not invent evidence — mark gaps [needs source].\n\n{{draft}}" },
    ],
  },
  {
    id: "p-code-review",
    title: "Adversarial code review",
    description: "Reviews a diff for real defects only. Explicitly forbids style commentary.",
    body: `Review this diff as a hostile reviewer whose reputation depends on catching what CI will not.

LANGUAGE: {{language}}
CONTEXT: {{context}}

For each finding give:
1. The exact line
2. A concrete failure scenario — specific inputs or state that produce a wrong result
3. The minimal fix

Rules:
- Correctness, security, and data-loss bugs only. No style, no naming, no "consider extracting".
- If a finding depends on code not shown, say what you would need to see instead of guessing.
- If you find nothing, say "No defects found" and name the three riskiest lines you checked.

---
{{diff}}`,
    category: "engineering",
    tags: ["review", "quality", "team"],
    variables: [
      { name: "language", label: "Language", description: "", type: "select", defaultValue: "TypeScript", options: ["TypeScript", "Python", "Go", "Rust", "SQL", "Other"] },
      { name: "context", label: "Context", description: "What this code is part of, and what it must never do.", type: "text", defaultValue: "Billing service — must never double-charge" },
      { name: "diff", label: "Diff", description: "Unified diff or full file.", type: "longtext", defaultValue: "" },
    ],
    favorite: true,
    useCount: 98,
    modelIds: ["m-claude-opus-45", "m-deepseek-v32"],
    createdDaysAgo: 178,
    updatedDaysAgo: 4,
    lastUsedDaysAgo: 0,
    versionHistory: [
      { daysAgo: 178, note: "First version", body: "Review this diff for bugs.\n\n{{diff}}" },
      { daysAgo: 61, note: "Banned style comments — they drowned the real findings", body: "Review this {{language}} diff. Correctness and security only, no style.\n\n{{diff}}" },
    ],
  },
  {
    id: "p-doc-analysis",
    title: "Structured document analysis",
    description: "Turns a long document into claims, evidence, and gaps rather than a summary.",
    body: `Analyse the document below. Do not summarise it — decompose it.

FOCUS: {{topic}}
DEPTH: {{depth}}

Produce exactly these sections:

**Central claim** — one sentence, in the author's own framing.

**Supporting arguments** — each as: claim → the evidence given → how strong that evidence actually is.

**Unstated assumptions** — what must be true for the argument to hold, that the author never defends.

**Gaps and counterpoints** — the strongest objection a well-informed sceptic would raise.

**What I would need to verify this** — concrete, checkable items.

Quote sparingly and only when the exact wording carries the argument.

---
{{document}}`,
    category: "analysis",
    tags: ["research", "critical-reading"],
    variables: [
      { name: "topic", label: "Focus", description: "The angle to analyse from.", type: "text", defaultValue: "Technical feasibility and cost" },
      { name: "depth", label: "Depth", description: "", type: "select", defaultValue: "Thorough", options: ["Quick pass", "Thorough", "Exhaustive — assume I will act on this"] },
      { name: "document", label: "Document", description: "Paste the full text.", type: "longtext", defaultValue: "" },
    ],
    favorite: true,
    useCount: 76,
    modelIds: ["m-claude-opus-45", "m-gemini-3-pro"],
    createdDaysAgo: 156,
    updatedDaysAgo: 22,
    lastUsedDaysAgo: 1,
    versionHistory: [
      { daysAgo: 156, note: "First version", body: "Summarise this document about {{topic}}.\n\n{{document}}" },
    ],
  },
  {
    id: "p-changelog",
    title: "Release notes from commits",
    description: "Converts a raw commit log into notes a user would actually read.",
    body: `Turn this commit log into release notes for {{release}}.

AUDIENCE: {{audience}}

Group under: **New**, **Improved**, **Fixed**. Drop any group that would be empty.

Rules:
- One line per user-visible change. If a commit changes nothing a user can perceive, omit it.
- Write the effect, not the implementation. "Search now matches partial words" beats "refactor tokenizer".
- No emoji. No "we're excited to announce".
- End with a **Breaking** section only if something actually breaks, with the migration step.

---
{{commits}}`,
    category: "product",
    tags: ["release", "writing", "recurring"],
    variables: [
      { name: "release", label: "Release", description: "", type: "text", defaultValue: "v2.4.0" },
      { name: "audience", label: "Audience", description: "", type: "select", defaultValue: "End users", options: ["End users", "Developers integrating the API", "Internal team"] },
      { name: "commits", label: "Commit log", description: "Output of git log --oneline.", type: "longtext", defaultValue: "" },
    ],
    favorite: false,
    useCount: 41,
    modelIds: ["m-claude-sonnet-45"],
    createdDaysAgo: 132,
    updatedDaysAgo: 30,
    lastUsedDaysAgo: 5,
    versionHistory: [
      { daysAgo: 132, note: "First version", body: "Write release notes for {{release}} from these commits.\n\n{{commits}}" },
    ],
  },
  {
    id: "p-sql-explain",
    title: "Explain and optimise a query",
    description: "Reads a slow query plus its plan and proposes an indexed rewrite.",
    body: `You are a database engineer. Explain and then optimise this query.

ENGINE: {{engine}}
TABLE SIZE: {{scale}}

Step 1 — Explain in plain language what the query returns and how the planner will get there.
Step 2 — Name the single most expensive operation and why.
Step 3 — Propose a rewrite. Show the SQL.
Step 4 — List the indexes that would help, with the exact CREATE INDEX statement and what each one costs on write.
Step 5 — State what you would measure to confirm the improvement.

Do not propose an index that duplicates an existing one shown in the schema.

---
QUERY
{{query}}

SCHEMA / PLAN
{{plan}}`,
    category: "engineering",
    tags: ["sql", "performance", "database"],
    variables: [
      { name: "engine", label: "Engine", description: "", type: "select", defaultValue: "PostgreSQL 16", options: ["PostgreSQL 16", "MySQL 8", "SQLite", "BigQuery", "ClickHouse"] },
      { name: "scale", label: "Scale", description: "Rough row counts of the main tables.", type: "text", defaultValue: "orders ~40M rows, users ~2M rows" },
      { name: "query", label: "Query", description: "", type: "longtext", defaultValue: "" },
      { name: "plan", label: "Schema / EXPLAIN output", description: "", type: "longtext", defaultValue: "" },
    ],
    favorite: false,
    useCount: 29,
    modelIds: ["m-claude-opus-45", "m-deepseek-v32"],
    createdDaysAgo: 119,
    updatedDaysAgo: 47,
    lastUsedDaysAgo: 8,
    versionHistory: [],
  },
  {
    id: "p-user-interview",
    title: "Synthesise user interviews",
    description: "Finds the pattern across several interview transcripts without averaging them into mush.",
    body: `You are given {{count}} user interview transcripts about {{subject}}.

Produce:

**Patterns** — only things at least {{threshold}} participants said. For each: the pattern, who said it, and one verbatim quote.

**Sharp disagreements** — where participants directly contradict each other, and what would explain the split.

**Signal from one person** — the single most interesting thing said by exactly one participant, and why it might matter anyway.

**What we still do not know** — the questions these interviews did not answer.

Never invent a quote. Never smooth two different opinions into one bland finding. Attribute everything.

---
{{transcripts}}`,
    category: "research",
    tags: ["ux", "synthesis", "discovery"],
    variables: [
      { name: "count", label: "Number of interviews", description: "", type: "number", defaultValue: "8" },
      { name: "subject", label: "Subject", description: "", type: "text", defaultValue: "how teams currently track AI spend" },
      { name: "threshold", label: "Pattern threshold", description: "Minimum participants for something to count as a pattern.", type: "number", defaultValue: "3" },
      { name: "transcripts", label: "Transcripts", description: "", type: "longtext", defaultValue: "" },
    ],
    favorite: true,
    useCount: 34,
    modelIds: ["m-claude-opus-45", "m-gemini-3-pro"],
    createdDaysAgo: 88,
    updatedDaysAgo: 12,
    lastUsedDaysAgo: 2,
    versionHistory: [
      { daysAgo: 88, note: "First version", body: "Summarise these {{count}} interviews about {{subject}}.\n\n{{transcripts}}" },
    ],
  },
  {
    id: "p-landing-copy",
    title: "Landing page copy, one angle at a time",
    description: "Produces three distinct positioning angles instead of three rewordings of the same one.",
    body: `Write landing page copy for {{product}}.

WHO IT IS FOR: {{audience}}
THE PAINFUL STATUS QUO: {{pain}}

Give me three genuinely different angles — not three phrasings of one idea. Label each with the belief it is betting on.

For each angle:
- Headline (under 60 characters)
- Subhead (one sentence, says what it actually is)
- Three benefit lines, each naming a concrete outcome
- The primary call to action

Rules:
- No "revolutionise", "unleash", "supercharge", "seamless", "game-changing".
- Every benefit must survive the question "compared to what?".
- If the product's advantage is not obvious from the inputs, say so rather than inflating it.`,
    category: "marketing",
    tags: ["copy", "positioning", "launch"],
    variables: [
      { name: "product", label: "Product", description: "", type: "text", defaultValue: "AI Command Center — one place for every AI tool, model, prompt and invoice" },
      { name: "audience", label: "Audience", description: "", type: "text", defaultValue: "Solo builders and small teams paying for six AI subscriptions" },
      { name: "pain", label: "Painful status quo", description: "", type: "longtext", defaultValue: "Prompts live in notes apps, spend is invisible until the card statement, and nobody remembers which model was best for what." },
    ],
    favorite: false,
    useCount: 23,
    modelIds: ["m-gpt-51", "m-claude-opus-45"],
    createdDaysAgo: 74,
    updatedDaysAgo: 19,
    lastUsedDaysAgo: 4,
    versionHistory: [],
  },
  {
    id: "p-model-eval",
    title: "Head-to-head model evaluation",
    description: "A fixed rubric for comparing two model outputs on the same task, so scores stay comparable over time.",
    body: `You are scoring two model outputs for the same task. You do not know which model produced which.

TASK GIVEN TO BOTH:
{{task}}

Score each output 1-5 on:
- **Correctness** — is it factually and logically right
- **Instruction adherence** — did it do what was asked, including the constraints
- **Usefulness** — could I act on this without a follow-up turn
- **Concision** — is every sentence earning its place

Then:
- State the winner and the single deciding difference.
- Name one thing the loser did better.
- If they are equivalent, say so — do not manufacture a winner.

---
OUTPUT A
{{outputA}}

---
OUTPUT B
{{outputB}}`,
    category: "analysis",
    tags: ["evaluation", "benchmarking", "models"],
    variables: [
      { name: "task", label: "Task", description: "The identical prompt both models received.", type: "longtext", defaultValue: "" },
      { name: "outputA", label: "Output A", description: "", type: "longtext", defaultValue: "" },
      { name: "outputB", label: "Output B", description: "", type: "longtext", defaultValue: "" },
    ],
    favorite: true,
    useCount: 57,
    modelIds: ["m-claude-opus-45"],
    createdDaysAgo: 141,
    updatedDaysAgo: 8,
    lastUsedDaysAgo: 1,
    versionHistory: [
      { daysAgo: 141, note: "First version", body: "Which output is better, A or B?\n\nA: {{outputA}}\n\nB: {{outputB}}" },
      { daysAgo: 45, note: "Added the fixed rubric so scores compare across weeks", body: "Score A and B on correctness, adherence, usefulness, concision.\n\nA: {{outputA}}\nB: {{outputB}}" },
    ],
  },
  {
    id: "p-incident-postmortem",
    title: "Blameless incident timeline",
    description: "Builds a postmortem from raw logs and chat, keeping causes separate from contributing factors.",
    body: `Build a blameless postmortem from the raw material below.

INCIDENT: {{incident}}
SEVERITY: {{severity}}

Sections:

**Timeline** — timestamped, one line each, from first signal to full recovery. Mark the moment of detection and the moment of mitigation.

**Impact** — who was affected, how many, for how long, and what they could not do.

**Root cause** — the change or condition without which this would not have happened.

**Contributing factors** — things that made it worse or slower to find. These are not the root cause; keep them separate.

**What worked** — genuinely. Include it.

**Actions** — each with an owner slot and a clear done-condition. No action may be "be more careful".

Never name an individual as a cause. Systems fail, people find them.

---
{{material}}`,
    category: "operations",
    tags: ["incident", "postmortem", "reliability"],
    variables: [
      { name: "incident", label: "Incident", description: "", type: "text", defaultValue: "Search index stopped updating" },
      { name: "severity", label: "Severity", description: "", type: "select", defaultValue: "SEV-2", options: ["SEV-1", "SEV-2", "SEV-3", "Near miss"] },
      { name: "material", label: "Logs, alerts, chat", description: "Paste everything, unordered is fine.", type: "longtext", defaultValue: "" },
    ],
    favorite: false,
    useCount: 12,
    modelIds: ["m-claude-opus-45"],
    createdDaysAgo: 63,
    updatedDaysAgo: 63,
    lastUsedDaysAgo: 16,
    versionHistory: [],
  },
  {
    id: "p-shot-list",
    title: "Image prompt from a brief",
    description: "Expands a one-line visual idea into a consistent, generator-ready set of prompts.",
    body: `Turn this brief into {{variants}} image prompts that hold together as one visual set.

BRIEF: {{brief}}
MEDIUM: {{medium}}
ASPECT: {{aspect}}

For each variant give a single-paragraph prompt covering, in this order: subject, action or pose, environment, lighting, lens or medium characteristics, colour palette, mood.

Rules:
- Keep lighting, palette and medium identical across all variants — only the subject and framing change. That is what makes it a set.
- No brand names, no living artists.
- Add a short **Negative** line for each.
- End with one line describing the shared style so it can be reused as a style reference.`,
    category: "creative",
    tags: ["image", "midjourney", "art-direction"],
    variables: [
      { name: "brief", label: "Brief", description: "", type: "text", defaultValue: "A control room for AI tools — calm, analogue, precise" },
      { name: "variants", label: "Variants", description: "", type: "number", defaultValue: "4" },
      { name: "medium", label: "Medium", description: "", type: "select", defaultValue: "Editorial photography", options: ["Editorial photography", "Technical illustration", "3D render", "Risograph print", "Cinematic still"] },
      { name: "aspect", label: "Aspect ratio", description: "", type: "select", defaultValue: "16:9", options: ["1:1", "3:2", "16:9", "4:5", "21:9"] },
    ],
    favorite: false,
    useCount: 38,
    modelIds: ["m-gpt-51", "m-claude-sonnet-45"],
    createdDaysAgo: 97,
    updatedDaysAgo: 25,
    lastUsedDaysAgo: 3,
    versionHistory: [],
  },
  {
    id: "p-meeting-actions",
    title: "Meeting transcript to decisions",
    description: "Extracts only what was decided and what was committed to. Discards the discussion.",
    body: `From this transcript, extract only what changed.

MEETING: {{meeting}}

**Decisions** — what was actually decided, and by whom. If something was discussed but not decided, it does not belong here.

**Commitments** — who said they would do what, by when. Use the person's own words for the task. If no date was given, write "no date agreed".

**Open questions** — things raised and left unresolved, with who raised them.

**Disagreements not settled** — state both positions neutrally.

Do not include summary, context, or "the team discussed". If a section is empty, write "None".

---
{{transcript}}`,
    category: "operations",
    tags: ["meetings", "extraction", "recurring"],
    variables: [
      { name: "meeting", label: "Meeting", description: "", type: "text", defaultValue: "Weekly product sync" },
      { name: "transcript", label: "Transcript", description: "", type: "longtext", defaultValue: "" },
    ],
    favorite: true,
    useCount: 111,
    modelIds: ["m-claude-haiku-45", "m-claude-sonnet-45"],
    createdDaysAgo: 186,
    updatedDaysAgo: 33,
    lastUsedDaysAgo: 0,
    versionHistory: [
      { daysAgo: 186, note: "First version", body: "Summarise this meeting and list action items.\n\n{{transcript}}" },
      { daysAgo: 120, note: "Dropped the summary section — nobody read it", body: "Extract decisions and commitments from {{meeting}}.\n\n{{transcript}}" },
    ],
  },
  {
    id: "p-onboarding-email",
    title: "Lifecycle email, single job",
    description: "One email, one job. Refuses to bundle three asks into one send.",
    body: `Write one lifecycle email.

MOMENT: {{moment}}
THE ONE ACTION: {{action}}
WHAT THEY ALREADY DID: {{context}}

Constraints:
- Subject line under 45 characters. No emoji, no "Quick question".
- Under 120 words in the body.
- Exactly one call to action. If a second useful action exists, name it in a single PS line, not a second button.
- Open with what they did, not with "Hi there!".
- No exclamation marks.

Return: Subject, Preview text, Body, CTA label.`,
    category: "marketing",
    tags: ["email", "lifecycle", "retention"],
    variables: [
      { name: "moment", label: "Lifecycle moment", description: "", type: "select", defaultValue: "Finished onboarding, has not returned in 3 days", options: ["Signed up, not activated", "Finished onboarding, has not returned in 3 days", "Hit a usage milestone", "Trial ending in 3 days", "Cancelled"] },
      { name: "action", label: "The one action", description: "", type: "text", defaultValue: "Import their first prompt into the vault" },
      { name: "context", label: "What they already did", description: "", type: "text", defaultValue: "Connected two tools and set a $200 monthly budget" },
    ],
    favorite: false,
    useCount: 18,
    modelIds: ["m-gpt-51"],
    createdDaysAgo: 45,
    updatedDaysAgo: 45,
    lastUsedDaysAgo: 11,
    versionHistory: [],
  },
];
