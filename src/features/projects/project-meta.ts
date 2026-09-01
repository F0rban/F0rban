import type { ProjectStatus } from "@/lib/data/types";
import type { BadgeTone } from "@/components/ui/badge";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  planning: "Planning",
  paused: "Paused",
  shipped: "Shipped",
  archived: "Archived",
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  active: "positive",
  planning: "info",
  paused: "warning",
  shipped: "accent",
  archived: "neutral",
};

export const PROJECT_STATUSES = Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[];

/** Board column order — the way work actually moves. */
export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "active",
  "planning",
  "paused",
  "shipped",
  "archived",
];
