import type { Modality, ModelMetricKey } from "@/lib/data/types";

export const METRIC_KEYS: ModelMetricKey[] = [
  "reasoning",
  "coding",
  "creativity",
  "speed",
  "instruction",
];

export const METRIC_LABEL: Record<ModelMetricKey, string> = {
  reasoning: "Reasoning",
  coding: "Coding",
  creativity: "Creativity",
  speed: "Speed",
  instruction: "Instruction",
};

export const MODALITY_LABEL: Record<Modality, string> = {
  text: "Text",
  image: "Image",
  audio: "Audio",
  video: "Video",
  code: "Code",
};

export const MODALITIES: Modality[] = ["text", "image", "audio", "video", "code"];

/** Comparison is capped at four — beyond that overlaid radars stop being readable. */
export const MAX_COMPARE = 4;

/** Colour assigned to a model by its position in the comparison, not its provider. */
export function compareColor(index: number): string {
  return `var(--series-${[1, 2, 3, 6][index % 4]})`;
}
