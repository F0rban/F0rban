import type { PromptCategory } from "@/lib/data/types";

export const PROMPT_CATEGORY_LABEL: Record<PromptCategory, string> = {
  writing: "Writing",
  engineering: "Engineering",
  analysis: "Analysis",
  research: "Research",
  marketing: "Marketing",
  product: "Product",
  creative: "Creative",
  operations: "Operations",
};

export const PROMPT_CATEGORIES = Object.keys(PROMPT_CATEGORY_LABEL) as PromptCategory[];

/** Categories keep a stable series colour so the vault reads as one system. */
export const PROMPT_CATEGORY_SERIES: Record<PromptCategory, number> = {
  writing: 1,
  engineering: 2,
  analysis: 3,
  research: 6,
  marketing: 4,
  product: 5,
  creative: 7,
  operations: 8,
};
