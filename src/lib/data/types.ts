/**
 * Domain model for Bench.
 *
 * Every entity is a plain, serialisable object with a string `id`. Nothing in
 * here imports React or touches storage — the same types are reused by the
 * local-storage adapter today and by a Postgres/Supabase adapter later.
 */

export type Id = string;
export type IsoDate = string;

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "meta"
  | "mistral"
  | "deepseek"
  | "xai"
  | "perplexity"
  | "midjourney"
  | "runway"
  | "elevenlabs"
  | "cursor"
  | "github"
  | "stability"
  | "cohere"
  | "other";

export interface Provider {
  id: ProviderId;
  name: string;
  /** Two-letter monogram used by the logo tile when no artwork exists. */
  monogram: string;
  /** Index into the categorical series palette (1-8). */
  series: number;
  website: string;
}

/* ------------------------------------------------------------------ *
 * Tools
 * ------------------------------------------------------------------ */

export type ToolCategory =
  | "assistant"
  | "coding"
  | "image"
  | "video"
  | "audio"
  | "research"
  | "writing"
  | "productivity"
  | "infrastructure";

export type ToolStatus = "active" | "trial" | "evaluating" | "paused" | "cancelled";

export type BillingCycle = "monthly" | "annual" | "usage" | "free";

export interface Tool {
  id: Id;
  name: string;
  provider: ProviderId;
  category: ToolCategory;
  /** One sentence, written the way the user would describe it to a colleague. */
  description: string;
  status: ToolStatus;
  /** Normalised to a monthly figure even when billed annually. */
  monthlyCost: number;
  billingCycle: BillingCycle;
  seats: number;
  /** Model this tool runs on by default, when it exposes one. */
  primaryModelId: Id | null;
  url: string;
  notes: string;
  favorite: boolean;
  tags: string[];
  addedAt: IsoDate;
  lastUsedAt: IsoDate | null;
  /** Sessions in the last 30 days — drives the "actually used?" signal. */
  usage30d: number;
  renewsOn: IsoDate | null;
}

/* ------------------------------------------------------------------ *
 * Models
 * ------------------------------------------------------------------ */

export type Modality = "text" | "image" | "audio" | "video" | "code";

export interface ModelScores {
  reasoning: number;
  coding: number;
  creativity: number;
  speed: number;
  instruction: number;
}

export interface Model {
  id: Id;
  name: string;
  provider: ProviderId;
  family: string;
  releasedAt: IsoDate;
  knowledgeCutoff: string;
  /** Input tokens the model accepts in one request. */
  contextWindow: number;
  maxOutput: number;
  /** USD per 1M tokens. */
  inputPrice: number;
  outputPrice: number;
  /** Output tokens per second, steady state. */
  throughput: number;
  /** Time to first token, milliseconds. */
  latencyMs: number;
  modalities: Modality[];
  scores: ModelScores;
  openWeights: boolean;
  /** The user's own 0-10 rating. Null until they score it. */
  personalScore: number | null;
  notes: string;
  favorite: boolean;
  tags: string[];
}

export type ModelMetricKey = keyof ModelScores;

/* ------------------------------------------------------------------ *
 * Prompts
 * ------------------------------------------------------------------ */

export type PromptVariableType = "text" | "longtext" | "select" | "number";

export interface PromptVariable {
  name: string;
  label: string;
  description: string;
  type: PromptVariableType;
  defaultValue: string;
  /** Only meaningful when type === "select". */
  options?: string[];
}

export interface PromptVersion {
  id: Id;
  body: string;
  createdAt: IsoDate;
  note: string;
}

export interface Prompt {
  id: Id;
  title: string;
  description: string;
  /** Body may contain {{variable}} placeholders. */
  body: string;
  category: PromptCategory;
  tags: string[];
  variables: PromptVariable[];
  favorite: boolean;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  lastUsedAt: IsoDate | null;
  useCount: number;
  /** Models this prompt is known to work well with. */
  modelIds: Id[];
  versions: PromptVersion[];
}

export type PromptCategory =
  | "writing"
  | "engineering"
  | "analysis"
  | "research"
  | "marketing"
  | "product"
  | "creative"
  | "operations";

/* ------------------------------------------------------------------ *
 * Projects
 * ------------------------------------------------------------------ */

export type ProjectStatus = "active" | "planning" | "paused" | "shipped" | "archived";

export interface ProjectTask {
  id: Id;
  title: string;
  done: boolean;
  dueDate: IsoDate | null;
}

export interface Project {
  id: Id;
  name: string;
  /** Short slug-like code shown in dense lists, e.g. "ATL". */
  code: string;
  description: string;
  status: ProjectStatus;
  objectives: string[];
  tasks: ProjectTask[];
  promptIds: Id[];
  toolIds: Id[];
  modelIds: Id[];
  notes: string;
  /** Monthly budget in USD. Null means untracked. */
  budget: number | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  dueDate: IsoDate | null;
  /** Index into the categorical series palette (1-8). */
  series: number;
  tags: string[];
}

/* ------------------------------------------------------------------ *
 * Spending
 * ------------------------------------------------------------------ */

export type SpendKind = "subscription" | "usage" | "credit" | "one-off";

export type SpendCategory =
  | "assistant"
  | "coding"
  | "image"
  | "video"
  | "audio"
  | "research"
  | "writing"
  | "productivity"
  | "api"
  | "infrastructure";

export interface SpendEntry {
  id: Id;
  date: IsoDate;
  provider: ProviderId;
  toolId: Id | null;
  projectId: Id | null;
  modelId: Id | null;
  category: SpendCategory;
  kind: SpendKind;
  /** USD. Credits are stored negative. */
  amount: number;
  description: string;
  /** Present for usage-based rows so cost-per-token views are possible. */
  tokensIn: number | null;
  tokensOut: number | null;
}

/* ------------------------------------------------------------------ *
 * Activity
 * ------------------------------------------------------------------ */

export type ActivityKind =
  | "prompt.run"
  | "prompt.created"
  | "prompt.updated"
  | "duel.started"
  | "duel.decided"
  | "verdict.changed"
  | "tool.added"
  | "tool.status"
  | "model.scored"
  | "project.updated"
  | "project.created"
  | "spend.recorded"
  | "budget.alert";

export interface ActivityEvent {
  id: Id;
  at: IsoDate;
  kind: ActivityKind;
  title: string;
  detail: string;
  entityType: EntityType | null;
  entityId: Id | null;
  /** USD cost attributable to this event, when there is one. */
  cost: number | null;
}

/* ------------------------------------------------------------------ *
 * Preferences & workspace
 * ------------------------------------------------------------------ */

export type ThemeMode = "light" | "dark" | "system";

export interface Preferences {
  theme: ThemeMode;
  /** Monthly spend ceiling in USD. */
  monthlyBudget: number;
  currency: "USD" | "EUR" | "GBP";
  displayName: string;
  onboardingComplete: boolean;
  /** Entity ids the user pinned during onboarding. */
  focusModelIds: Id[];
  compactDensity: boolean;
  reduceMotion: boolean;
  /**
   * True while the workspace still holds the seeded example evidence. Shown as
   * a banner, because presenting someone else's record as theirs would poison
   * the one thing this product sells.
   */
  usingSampleData: boolean;
}

export type EntityType =
  | "tool"
  | "model"
  | "prompt"
  | "project"
  | "duel"
  | "spend";

/** The full serialisable state of a workspace. One adapter round-trip. */
export interface Workspace {
  version: number;
  tools: Tool[];
  models: Model[];
  prompts: Prompt[];
  projects: Project[];
  duels: Duel[];
  taskProfiles: TaskProfile[];
  spend: SpendEntry[];
  activity: ActivityEvent[];
  preferences: Preferences;
}

/* ------------------------------------------------------------------ *
 * Duels — the core primitive
 *
 * A duel is one real task run against several models, judged blind. It is the
 * only way evidence enters the system, and everything downstream (verdicts,
 * routing, savings) is derived from these records.
 * ------------------------------------------------------------------ */

export type TaskType =
  | "code-review"
  | "code-generation"
  | "summarisation"
  | "classification"
  | "long-form-writing"
  | "research-synthesis"
  | "brainstorming"
  | "data-extraction";

export interface DuelEntry {
  modelId: Id;
  /** The model's answer. Optional — a verdict can be recorded without it. */
  output: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  /** USD, computed from the model's price at the time of the run. */
  cost: number;
}

export type DuelStatus = "pending" | "decided";

export interface Duel {
  id: Id;
  /** What the task actually was, in the user's words. */
  title: string;
  taskType: TaskType;
  createdAt: IsoDate;
  decidedAt: IsoDate | null;
  status: DuelStatus;
  promptId: Id | null;
  projectId: Id | null;
  entries: DuelEntry[];
  /** Null while pending. */
  winnerModelId: Id | null;
  /** True when more than one entry was judged equally good. */
  tie: boolean;
  /** Why this one won, in the user's words. */
  reason: string;
  /** Whether model identity was hidden while judging. Untrusted if false. */
  blind: boolean;
  /**
   * Part of the seeded worked example rather than the user's own record. Kept on
   * the row so the two can never be silently mixed: the app either shows the
   * example (labelled) or the user's evidence, and starting the first own duel
   * removes every row carrying this flag.
   */
  sample: boolean;
}

/**
 * How much of each task type the user actually runs, and on what.
 *
 * Without volume there is no saving to compute — a verdict that says "Haiku
 * wins classification" is only worth money once you know you run 12,000 of them
 * a month. Estimated by the user today; read from usage APIs later.
 */
export interface TaskProfile {
  taskType: TaskType;
  /** What they currently default to for this kind of work. */
  currentModelId: Id;
  runsPerMonth: number;
  /** Typical shape of one run, used to price alternatives. */
  avgTokensIn: number;
  avgTokensOut: number;
}
