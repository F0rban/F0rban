import type { DuelEntry, Model, ProviderId } from "@/lib/data/types";
import { estimateLatency, priceRunRounded } from "./pricing";

/**
 * The seam between a duel and whatever produces its answers.
 *
 * A duel entry has one shape whether a person pasted the answer or an API
 * returned it: output, tokens, latency, cost. `DuelRunner` is the thing that
 * fills that shape for one model. Today there is a single implementation, the
 * manual one, and it produces a priced estimate the user completes by hand.
 * An Anthropic, OpenAI or Google runner implements the same two methods and
 * fills the entry from a real response — nothing above this file changes.
 */

export interface RunRequest {
  model: Model;
  /** The prompt to run. Empty for an ad hoc task the user runs from memory. */
  prompt: string;
  /** Expected shape of the run, used to price it when nothing is measured. */
  expectedTokensIn: number;
  expectedTokensOut: number;
}

export type RunResult = Omit<DuelEntry, "modelId">;

export interface DuelRunner {
  readonly id: string;
  /** Manual runners estimate; API runners measure. */
  readonly kind: "manual" | "api";
  supports(provider: ProviderId): boolean;
  run(request: RunRequest): Promise<RunResult>;
}

/**
 * The runner Bench ships with: the user runs the prompt in whichever apps they
 * already use and pastes (or simply judges). Tokens, latency and cost are
 * catalogue estimates until a provider is connected, and the entry says so.
 */
export class ManualRunner implements DuelRunner {
  readonly id = "manual";
  readonly kind = "manual" as const;

  supports(): boolean {
    return true;
  }

  async run({ model, expectedTokensIn, expectedTokensOut }: RunRequest): Promise<RunResult> {
    return {
      output: "",
      tokensIn: expectedTokensIn,
      tokensOut: expectedTokensOut,
      latencyMs: estimateLatency(model, expectedTokensOut),
      cost: priceRunRounded(model, expectedTokensIn, expectedTokensOut),
      source: "manual",
    };
  }
}
