import type { ProviderId } from "@/lib/data/types";
import { ManualRunner, type DuelRunner } from "./runner";

/**
 * Which providers Bench intends to call directly, and whether it can yet.
 *
 * Deliberately a list of three: these are the APIs whose models the seed
 * corpus is built on. `available` flips to true when a key is configured and a
 * runner for that provider is registered; until then every model is driven by
 * the manual runner, and the UI can say exactly that.
 */
export interface ProviderConnection {
  provider: ProviderId;
  label: string;
  available: boolean;
}

export const CONNECTABLE: ProviderConnection[] = [
  { provider: "anthropic", label: "Anthropic API", available: false },
  { provider: "openai", label: "OpenAI API", available: false },
  { provider: "google", label: "Gemini API", available: false },
];

const runners: DuelRunner[] = [new ManualRunner()];

/** Adds a runner ahead of the manual fallback. Called once per connected provider. */
export function registerRunner(runner: DuelRunner): void {
  runners.unshift(runner);
}

/** An API runner when one is connected for this provider, otherwise manual. */
export function runnerFor(provider: ProviderId): DuelRunner {
  return (
    runners.find((runner) => runner.kind === "api" && runner.supports(provider)) ??
    runners.find((runner) => runner.kind === "manual")!
  );
}
