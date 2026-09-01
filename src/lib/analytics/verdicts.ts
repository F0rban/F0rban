import type { Duel, Model, TaskProfile, TaskType } from "../data/types";
import { priceRun } from "../providers/pricing";
import { round } from "./spend";

/**
 * Turns duel records into routing decisions.
 *
 * The hard part is not counting wins — it is being honest about how much a
 * count of nine proves. Everything here is built so the app can say "I do not
 * know yet" as easily as it says "use this one".
 */

/* ------------------------------------------------------------------ *
 * Statistics
 * ------------------------------------------------------------------ */

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return result;
}

/**
 * One-sided probability of the leader winning at least `wins` of `n` decisive
 * duels if the models were actually equal. Exact, because n is small.
 */
export function coinFlipProbability(wins: number, n: number): number {
  if (n === 0) return 1;
  let sum = 0;
  for (let i = wins; i <= n; i++) sum += binomial(n, i);
  return sum / 2 ** n;
}

export type Confidence = "insufficient" | "emerging" | "clear-winner" | "too-close";

/**
 * Labels scale with the evidence, so the word on the chip is itself a claim
 * about how much to trust the row: a signal, a lean, strong evidence, or the
 * equally real finding that there is no difference to find.
 */
export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  insufficient: "Early signal",
  emerging: "Leaning",
  "clear-winner": "Strong evidence",
  "too-close": "No difference",
};

/** The label, except that zero results is not a signal of anything. */
export function confidenceLabel(confidence: Confidence, sampleSize: number): string {
  if (confidence === "insufficient" && sampleSize === 0) return "No evidence yet";
  return CONFIDENCE_LABEL[confidence];
}

/** Below this many results, the record is an anecdote. */
export const MIN_SAMPLE = 5;
/** Above this, a coin-flip record is itself the finding. */
export const EQUIVALENCE_SAMPLE = 8;
/**
 * A leader may take at most this share of decisive results before the record
 * stops being an equivalence. Without this, "not significant" swallows real
 * signal — a 7-3 record with a six-win streak is a leaning, not a tie.
 */
export const EQUIVALENCE_MAX_SHARE = 0.6;
const ALPHA = 0.05;

/* ------------------------------------------------------------------ *
 * Standings
 * ------------------------------------------------------------------ */

export interface Standing {
  modelId: string;
  wins: number;
  losses: number;
  ties: number;
  played: number;
  winRate: number;
  /** Mean cost of this model's entry across the duels it appeared in. */
  avgCost: number;
  avgLatencyMs: number;
  /** Result of the most recent six appearances, newest first: W, L or T. */
  form: Array<"W" | "L" | "T">;
}

export function standingsFor(duels: Duel[]): Standing[] {
  const decided = duels.filter((d) => d.status === "decided");
  const byModel = new Map<string, Standing>();

  const ensure = (modelId: string): Standing => {
    let standing = byModel.get(modelId);
    if (!standing) {
      standing = {
        modelId,
        wins: 0,
        losses: 0,
        ties: 0,
        played: 0,
        winRate: 0,
        avgCost: 0,
        avgLatencyMs: 0,
        form: [],
      };
      byModel.set(modelId, standing);
    }
    return standing;
  };

  const costTotals = new Map<string, { cost: number; latency: number; n: number }>();

  // Newest first, so `form` reads left-to-right as most recent first.
  for (const duel of [...decided].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    for (const entry of duel.entries) {
      const standing = ensure(entry.modelId);
      standing.played += 1;

      const totals = costTotals.get(entry.modelId) ?? { cost: 0, latency: 0, n: 0 };
      totals.cost += entry.cost;
      totals.latency += entry.latencyMs;
      totals.n += 1;
      costTotals.set(entry.modelId, totals);

      let result: "W" | "L" | "T";
      if (duel.tie) {
        standing.ties += 1;
        result = "T";
      } else if (duel.winnerModelId === entry.modelId) {
        standing.wins += 1;
        result = "W";
      } else {
        standing.losses += 1;
        result = "L";
      }
      if (standing.form.length < 6) standing.form.push(result);
    }
  }

  for (const standing of byModel.values()) {
    const decisive = standing.wins + standing.losses;
    standing.winRate = decisive > 0 ? round((standing.wins / decisive) * 100, 1) : 0;
    const totals = costTotals.get(standing.modelId)!;
    standing.avgCost = round(totals.cost / totals.n, 6);
    standing.avgLatencyMs = Math.round(totals.latency / totals.n);
  }

  return [...byModel.values()].sort(
    (a, b) => b.wins - a.wins || a.losses - b.losses || b.played - a.played,
  );
}

/* ------------------------------------------------------------------ *
 * Verdicts
 * ------------------------------------------------------------------ */

export interface Verdict {
  taskType: TaskType;
  sampleSize: number;
  decisive: number;
  ties: number;
  standings: Standing[];
  confidence: Confidence;
  /** Probability of the leader's record arising from two equal models. */
  pValue: number;
  /** What the evidence says to use. Null when there is not enough of it. */
  recommendedModelId: string | null;
  /** Why that one: it won, or nothing won and it is the cheapest. */
  basis: "won" | "cheapest-of-equals" | null;
  /** What the user actually runs this task type on today. */
  currentModelId: string | null;
  runsPerMonth: number;
  currentMonthlyCost: number;
  recommendedMonthlyCost: number;
  /** Positive means following the verdict saves money; negative means it costs. */
  monthlyDelta: number;
  /** Set when the recent record contradicts the lifetime record. */
  reversal: { leaderId: string; previousLeaderId: string; recentWins: number; recentOf: number } | null;
}

/** One place prices a run; this is only the local name for it. */
const costPerRun = priceRun;

/**
 * Detects a leadership change: the model leading over the whole record is not
 * the one winning lately. This is what keeps the ledger from calcifying into a
 * benchmark that stopped watching.
 */
function detectReversal(duels: Duel[], standings: Standing[]): Verdict["reversal"] {
  const decided = duels
    .filter((d) => d.status === "decided" && !d.tie && d.winnerModelId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (decided.length < 6) return null;

  const recent = decided.slice(0, 6);
  const recentWins = new Map<string, number>();
  for (const duel of recent) {
    recentWins.set(duel.winnerModelId!, (recentWins.get(duel.winnerModelId!) ?? 0) + 1);
  }
  const [recentLeaderId, wins] = [...recentWins.entries()].sort((a, b) => b[1] - a[1])[0]!;

  // The overall leader among decisive results only.
  const overallLeader = [...standings].sort((a, b) => b.wins - a.wins)[0];
  if (!overallLeader) return null;

  // A reversal is only interesting if the recent run is lopsided and the
  // lifetime record still points the other way.
  const older = decided.slice(6);
  const olderWins = new Map<string, number>();
  for (const duel of older) {
    olderWins.set(duel.winnerModelId!, (olderWins.get(duel.winnerModelId!) ?? 0) + 1);
  }
  const olderLeader = [...olderWins.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!olderLeader || olderLeader[0] === recentLeaderId) return null;
  if (wins < 5) return null;

  return {
    leaderId: recentLeaderId,
    previousLeaderId: olderLeader[0],
    recentWins: wins,
    recentOf: recent.length,
  };
}

export function verdictFor(
  taskType: TaskType,
  duels: Duel[],
  models: Model[],
  profile: TaskProfile | undefined,
): Verdict {
  const relevant = duels.filter((d) => d.taskType === taskType && d.status === "decided");
  const standings = standingsFor(relevant);
  const ties = relevant.filter((d) => d.tie).length;
  const decisive = relevant.length - ties;
  const leader = standings[0];
  const pValue = leader ? coinFlipProbability(leader.wins, decisive) : 1;

  const leaderShare = leader && decisive > 0 ? leader.wins / decisive : 0;

  let confidence: Confidence;
  if (relevant.length < MIN_SAMPLE || !leader) {
    confidence = "insufficient";
  } else if (pValue <= ALPHA) {
    confidence = "clear-winner";
  } else if (relevant.length >= EQUIVALENCE_SAMPLE && leaderShare <= EQUIVALENCE_MAX_SHARE) {
    // Enough attempts to have found a difference, and the record really is
    // level. That is a result in itself: pick on price.
    confidence = "too-close";
  } else {
    confidence = "emerging";
  }

  const modelById = new Map(models.map((m) => [m.id, m]));
  const contenders = standings
    .map((s) => modelById.get(s.modelId))
    .filter((m): m is Model => Boolean(m));

  const tokensIn = profile?.avgTokensIn ?? 0;
  const tokensOut = profile?.avgTokensOut ?? 0;

  let recommendedModelId: string | null = null;
  let basis: Verdict["basis"] = null;

  if ((confidence === "clear-winner" || confidence === "emerging") && leader) {
    // An emerging leader is still the best guess available — the UI presents it
    // as a lean, not a rule, and `isActionable` keeps it out of the routing
    // table until the evidence settles.
    recommendedModelId = leader.modelId;
    basis = "won";
  } else if (confidence === "too-close" && contenders.length > 0) {
    const cheapest = [...contenders].sort(
      (a, b) => costPerRun(a, tokensIn, tokensOut) - costPerRun(b, tokensIn, tokensOut),
    )[0]!;
    recommendedModelId = cheapest.id;
    basis = "cheapest-of-equals";
  }

  const runsPerMonth = profile?.runsPerMonth ?? 0;
  const current = profile ? modelById.get(profile.currentModelId) : undefined;
  const recommended = recommendedModelId ? modelById.get(recommendedModelId) : undefined;

  const currentMonthlyCost = current
    ? round(costPerRun(current, tokensIn, tokensOut) * runsPerMonth)
    : 0;
  const recommendedMonthlyCost = recommended
    ? round(costPerRun(recommended, tokensIn, tokensOut) * runsPerMonth)
    : 0;

  return {
    taskType,
    sampleSize: relevant.length,
    decisive,
    ties,
    standings,
    confidence,
    pValue: round(pValue, 4),
    recommendedModelId,
    basis,
    currentModelId: profile?.currentModelId ?? null,
    runsPerMonth,
    currentMonthlyCost,
    recommendedMonthlyCost,
    monthlyDelta:
      recommended && current ? round(currentMonthlyCost - recommendedMonthlyCost) : 0,
    reversal: detectReversal(relevant, standings),
  };
}

/**
 * The p-value in words.
 *
 * "p = 0.033" tells almost nobody anything. "A record like this would come up
 * about 3 times in 100 by chance" is the same number and an actual sentence.
 */
export function chanceSentence(wins: number, losses: number, pValue: number): string {
  if (wins + losses === 0) return "No decisive results yet.";
  const inHundred = Math.round(pValue * 100);
  if (inHundred >= 45) {
    return `A ${wins}–${losses} record is what you would expect from a coin flip.`;
  }
  if (inHundred < 1) {
    return `A ${wins}–${losses} record would come up by chance less than once in 100 tries.`;
  }
  return `A ${wins}–${losses} record would come up by chance about ${inHundred} time${inHundred === 1 ? "" : "s"} in 100.`;
}

/**
 * Why the verdict says what it says, in one sentence a person could repeat to
 * a colleague. A recommendation is only worth following when the reason is on
 * the table beside it: who is ahead, by how much, how likely that is to be
 * luck — and, for an equivalence, that price made the call.
 */
export function explainVerdict(verdict: Verdict, models: Map<string, Model> | Model[]): string {
  const byId = models instanceof Map ? models : new Map(models.map((m) => [m.id, m]));
  const name = (id: string | null) => (id ? (byId.get(id)?.name ?? id) : "the leader");
  const leader = verdict.standings[0];

  if (!leader || verdict.sampleSize === 0) return "No duels for this kind of work yet.";

  switch (verdict.confidence) {
    case "clear-winner":
      return `${name(leader.modelId)} won ${leader.wins} of ${verdict.decisive} decisive duels. ${chanceSentence(leader.wins, leader.losses, verdict.pValue)}`;
    case "too-close": {
      const record = `${leader.wins}–${leader.losses}${verdict.ties ? `–${verdict.ties}` : ""}`;
      const cheapest = verdict.standings.length > 2 ? "the cheapest of them" : "the cheaper of the two";
      return `Level across ${verdict.sampleSize} duels (${record}), so price decides: ${name(verdict.recommendedModelId)} is ${cheapest}.`;
    }
    case "emerging":
      return `${name(leader.modelId)} is ahead ${leader.wins}–${leader.losses}. ${chanceSentence(leader.wins, leader.losses, verdict.pValue)} Not a rule yet — keep running these.`;
    case "insufficient":
      return `${verdict.sampleSize} of ${MIN_SAMPLE} results so far — a guess, not a verdict.`;
  }
}

export function allVerdicts(
  duels: Duel[],
  models: Model[],
  profiles: TaskProfile[],
  taskTypes: TaskType[],
): Verdict[] {
  const byType = new Map(profiles.map((p) => [p.taskType, p]));
  return taskTypes
    .map((taskType) => verdictFor(taskType, duels, models, byType.get(taskType)))
    .filter((verdict) => verdict.sampleSize > 0 || byType.has(verdict.taskType));
}

/** A verdict worth acting on: settled or equivalent, and it changes something. */
export function isActionable(verdict: Verdict): boolean {
  return (
    (verdict.confidence === "clear-winner" || verdict.confidence === "too-close") &&
    verdict.recommendedModelId !== null &&
    verdict.recommendedModelId !== verdict.currentModelId
  );
}

export interface RoutingSummary {
  /** Money saved per month by following every actionable verdict. */
  actionableSaving: number;
  /** Money that would be saved by verdicts still short of confidence. */
  pendingSaving: number;
  /** Verdicts where the better model costs more — a real trade, not a saving. */
  qualityUpgrades: Verdict[];
  actionable: Verdict[];
  confirmed: Verdict[];
  needsEvidence: Verdict[];
  /** Total spend across all profiled task types at current routing. */
  currentMonthlyCost: number;
}

export function routingSummary(verdicts: Verdict[]): RoutingSummary {
  const actionable = verdicts.filter(isActionable).filter((v) => v.monthlyDelta > 0);
  // A recommendation that costs more is a trade, not a saving. It belongs in
  // front of the user either way — including while the evidence is still only
  // leaning, because that is exactly when a judgement call is needed.
  const qualityUpgrades = verdicts.filter(
    (v) =>
      v.recommendedModelId !== null &&
      v.recommendedModelId !== v.currentModelId &&
      v.confidence !== "insufficient" &&
      v.monthlyDelta < 0,
  );
  const confirmed = verdicts.filter(
    (v) =>
      v.recommendedModelId !== null &&
      v.recommendedModelId === v.currentModelId &&
      v.confidence !== "insufficient",
  );
  const needsEvidence = verdicts.filter(
    (v) => v.confidence === "insufficient" || v.confidence === "emerging",
  );

  return {
    actionableSaving: round(actionable.reduce((sum, v) => sum + v.monthlyDelta, 0)),
    pendingSaving: round(
      verdicts
        .filter((v) => v.confidence === "emerging" && v.recommendedModelId !== v.currentModelId)
        .reduce((sum, v) => sum + Math.max(0, v.monthlyDelta), 0),
    ),
    qualityUpgrades,
    actionable,
    confirmed,
    needsEvidence,
    currentMonthlyCost: round(verdicts.reduce((sum, v) => sum + v.currentMonthlyCost, 0)),
  };
}

/**
 * A model's record across everything, for the Model Lab. Vendor benchmarks say
 * what a model can do; this says what it did for you.
 */
export function modelRecord(duels: Duel[], modelId: string): Standing | null {
  const relevant = duels.filter(
    (d) => d.status === "decided" && d.entries.some((e) => e.modelId === modelId),
  );
  return standingsFor(relevant).find((s) => s.modelId === modelId) ?? null;
}

/**
 * Task types this model is the recommendation for.
 *
 * Settled verdicts only — a lean is a candidate, not a badge, and counting them
 * would put "your pick" on almost every model.
 */
export function modelStrengths(verdicts: Verdict[], modelId: string): TaskType[] {
  return verdicts
    .filter(
      (v) =>
        v.recommendedModelId === modelId &&
        (v.confidence === "clear-winner" || v.confidence === "too-close"),
    )
    .map((v) => v.taskType);
}

/**
 * How thin the evidence still is, as one number. Drives the "keep going"
 * nudge — the product is only as good as the corpus behind it.
 */
export function evidenceCoverage(verdicts: Verdict[]): {
  covered: number;
  total: number;
  totalDuels: number;
} {
  const covered = verdicts.filter(
    (v) => v.confidence === "clear-winner" || v.confidence === "too-close",
  ).length;
  return {
    covered,
    total: verdicts.length,
    totalDuels: verdicts.reduce((sum, v) => sum + v.sampleSize, 0),
  };
}
