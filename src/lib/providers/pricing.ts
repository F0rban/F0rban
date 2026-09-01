import type { Model } from "@/lib/data/types";

/**
 * The one place a run is priced.
 *
 * Catalogue prices are USD per million tokens. Every estimate in the app —
 * the duel form, the seed corpus, the routing table, the settings total, the
 * model calculator — comes through here, so a change to how a run is priced
 * (cached input, batch discounts, a provider's real invoice) is one edit.
 */
export function priceRun(
  model: Pick<Model, "inputPrice" | "outputPrice">,
  tokensIn: number,
  tokensOut: number,
): number {
  return (tokensIn / 1_000_000) * model.inputPrice + (tokensOut / 1_000_000) * model.outputPrice;
}

/** The same figure rounded to the micro-dollar, the way a stored entry is. */
export function priceRunRounded(
  model: Pick<Model, "inputPrice" | "outputPrice">,
  tokensIn: number,
  tokensOut: number,
): number {
  return Math.round(priceRun(model, tokensIn, tokensOut) * 1_000_000) / 1_000_000;
}

/** Wall-clock estimate for generating `tokens` of output, including the first-token wait. */
export function estimateLatency(
  model: Pick<Model, "latencyMs" | "throughput">,
  tokens: number,
): number {
  return Math.round(model.latencyMs + (tokens / model.throughput) * 1000);
}
