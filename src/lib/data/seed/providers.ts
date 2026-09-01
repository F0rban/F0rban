import type { Provider, ProviderId } from "../types";

export const PROVIDERS: Record<ProviderId, Provider> = {
  openai: { id: "openai", name: "OpenAI", monogram: "OA", series: 5, website: "https://openai.com" },
  anthropic: { id: "anthropic", name: "Anthropic", monogram: "AN", series: 1, website: "https://anthropic.com" },
  google: { id: "google", name: "Google DeepMind", monogram: "GD", series: 6, website: "https://deepmind.google" },
  meta: { id: "meta", name: "Meta AI", monogram: "MA", series: 3, website: "https://ai.meta.com" },
  mistral: { id: "mistral", name: "Mistral AI", monogram: "MI", series: 4, website: "https://mistral.ai" },
  deepseek: { id: "deepseek", name: "DeepSeek", monogram: "DS", series: 2, website: "https://deepseek.com" },
  xai: { id: "xai", name: "xAI", monogram: "XA", series: 8, website: "https://x.ai" },
  perplexity: { id: "perplexity", name: "Perplexity", monogram: "PX", series: 2, website: "https://perplexity.ai" },
  midjourney: { id: "midjourney", name: "Midjourney", monogram: "MJ", series: 7, website: "https://midjourney.com" },
  runway: { id: "runway", name: "Runway", monogram: "RW", series: 4, website: "https://runwayml.com" },
  elevenlabs: { id: "elevenlabs", name: "ElevenLabs", monogram: "EL", series: 3, website: "https://elevenlabs.io" },
  cursor: { id: "cursor", name: "Anysphere", monogram: "CU", series: 8, website: "https://cursor.com" },
  github: { id: "github", name: "GitHub", monogram: "GH", series: 6, website: "https://github.com" },
  stability: { id: "stability", name: "Stability AI", monogram: "ST", series: 7, website: "https://stability.ai" },
  cohere: { id: "cohere", name: "Cohere", monogram: "CO", series: 5, website: "https://cohere.com" },
  other: { id: "other", name: "Other", monogram: "··", series: 8, website: "" },
};

export const PROVIDER_LIST: Provider[] = Object.values(PROVIDERS).filter((p) => p.id !== "other");

export function providerName(id: ProviderId): string {
  return PROVIDERS[id]?.name ?? "Unknown";
}
