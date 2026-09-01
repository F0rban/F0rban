import type { ToolCategory, ToolStatus } from "@/lib/data/types";
import type { BadgeTone } from "@/components/ui/badge";

export const TOOL_STATUS_LABEL: Record<ToolStatus, string> = {
  active: "Active",
  trial: "Trial",
  evaluating: "Evaluating",
  paused: "Paused",
  cancelled: "Cancelled",
};

export const TOOL_STATUS_TONE: Record<ToolStatus, BadgeTone> = {
  active: "positive",
  trial: "accent",
  evaluating: "info",
  paused: "warning",
  cancelled: "neutral",
};

export const TOOL_CATEGORY_LABEL: Record<ToolCategory, string> = {
  assistant: "Assistant",
  coding: "Coding",
  image: "Image",
  video: "Video",
  audio: "Audio",
  research: "Research",
  writing: "Writing",
  productivity: "Productivity",
  infrastructure: "Infrastructure",
};

export const TOOL_STATUSES = Object.keys(TOOL_STATUS_LABEL) as ToolStatus[];
export const TOOL_CATEGORIES = Object.keys(TOOL_CATEGORY_LABEL) as ToolCategory[];

/** Cost per recorded session over the last 30 days. Null when not measurable. */
export function costPerUse(monthlyCost: number, usage30d: number): number | null {
  if (monthlyCost <= 0 || usage30d <= 0) return null;
  return monthlyCost / usage30d;
}
