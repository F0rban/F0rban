import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  Download,
  Gavel,
  Home,
  Keyboard,
  Library,
  Monitor,
  Moon,
  PanelLeft,
  RotateCcw,
  Settings,
  SquarePen,
  Sun,
  Swords,
  Wallet,
} from "lucide-react";

export interface CommandAction {
  id: string;
  label: string;
  /** Extra words folded into matching, e.g. synonyms the user might type. */
  keywords: string;
  group: "Navigate" | "Create" | "Appearance" | "Workspace";
  icon: LucideIcon;
  shortcut?: string[];
  /** Resolved by the palette against its handler map. */
  run: CommandRunId;
  danger?: boolean;
}

export type CommandRunId =
  | "nav:today"
  | "nav:duels"
  | "nav:verdicts"
  | "nav:prompts"
  | "nav:models"
  | "nav:spend"
  | "nav:settings"
  | "create:duel"
  | "create:prompt"
  | "theme:light"
  | "theme:dark"
  | "theme:system"
  | "ui:sidebar"
  | "ui:shortcuts"
  | "data:export"
  | "data:reset";

export const COMMANDS: CommandAction[] = [
  { id: "c-today", label: "Go to Today", keywords: "home overview start dashboard", group: "Navigate", icon: Home, shortcut: ["G", "T"], run: "nav:today" },
  { id: "c-duels", label: "Go to Duels", keywords: "compare head to head test judge", group: "Navigate", icon: Swords, shortcut: ["G", "U"], run: "nav:duels" },
  { id: "c-verdicts", label: "Go to Verdicts", keywords: "routing table recommendation which model", group: "Navigate", icon: Gavel, shortcut: ["G", "V"], run: "nav:verdicts" },
  { id: "c-prompts", label: "Go to Prompts", keywords: "library templates snippets vault", group: "Navigate", icon: Library, shortcut: ["G", "P"], run: "nav:prompts" },
  { id: "c-models", label: "Go to Models", keywords: "compare benchmark llm lab", group: "Navigate", icon: Cpu, shortcut: ["G", "M"], run: "nav:models" },
  { id: "c-spend", label: "Go to Spend", keywords: "cost budget invoice money finops subscriptions tools", group: "Navigate", icon: Wallet, shortcut: ["G", "S"], run: "nav:spend" },
  { id: "c-settings", label: "Go to Settings", keywords: "preferences configuration volumes", group: "Navigate", icon: Settings, run: "nav:settings" },

  { id: "c-new-duel", label: "Run a new duel", keywords: "create compare test head to head models", group: "Create", icon: Swords, shortcut: ["D"], run: "create:duel" },
  { id: "c-new-prompt", label: "New prompt", keywords: "create add write template", group: "Create", icon: SquarePen, shortcut: ["N"], run: "create:prompt" },

  { id: "c-theme-light", label: "Switch to light theme", keywords: "appearance bright day", group: "Appearance", icon: Sun, run: "theme:light" },
  { id: "c-theme-dark", label: "Switch to dark theme", keywords: "appearance night", group: "Appearance", icon: Moon, run: "theme:dark" },
  { id: "c-theme-system", label: "Match system theme", keywords: "appearance auto os", group: "Appearance", icon: Monitor, run: "theme:system" },
  { id: "c-sidebar", label: "Toggle sidebar", keywords: "collapse expand rail", group: "Appearance", icon: PanelLeft, shortcut: ["["], run: "ui:sidebar" },
  { id: "c-shortcuts", label: "Keyboard shortcuts", keywords: "keys hotkeys help", group: "Appearance", icon: Keyboard, shortcut: ["?"], run: "ui:shortcuts" },

  { id: "c-export", label: "Export workspace as JSON", keywords: "download backup save data", group: "Workspace", icon: Download, run: "data:export" },
  { id: "c-reset", label: "Reset workspace to sample data", keywords: "clear wipe restore demo seed", group: "Workspace", icon: RotateCcw, run: "data:reset", danger: true },
];
