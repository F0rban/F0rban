import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Cpu,
  Download,
  FolderKanban,
  FolderPlus,
  Keyboard,
  LayoutDashboard,
  Library,
  Monitor,
  Moon,
  PanelLeft,
  RotateCcw,
  Settings,
  SquarePen,
  Sun,
  Wallet,
  Workflow,
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
  | "nav:dashboard"
  | "nav:projects"
  | "nav:prompts"
  | "nav:tools"
  | "nav:models"
  | "nav:workflows"
  | "nav:spending"
  | "nav:settings"
  | "create:prompt"
  | "create:project"
  | "create:tool"
  | "theme:light"
  | "theme:dark"
  | "theme:system"
  | "ui:sidebar"
  | "ui:shortcuts"
  | "data:export"
  | "data:reset";

export const COMMANDS: CommandAction[] = [
  { id: "c-dash", label: "Go to Dashboard", keywords: "home overview start", group: "Navigate", icon: LayoutDashboard, shortcut: ["G", "D"], run: "nav:dashboard" },
  { id: "c-projects", label: "Go to Projects", keywords: "work initiatives", group: "Navigate", icon: FolderKanban, shortcut: ["G", "R"], run: "nav:projects" },
  { id: "c-prompts", label: "Go to Prompt Vault", keywords: "library templates snippets", group: "Navigate", icon: Library, shortcut: ["G", "P"], run: "nav:prompts" },
  { id: "c-tools", label: "Go to Tools", keywords: "subscriptions apps stack", group: "Navigate", icon: Boxes, shortcut: ["G", "T"], run: "nav:tools" },
  { id: "c-models", label: "Go to Model Lab", keywords: "compare benchmark llm", group: "Navigate", icon: Cpu, shortcut: ["G", "M"], run: "nav:models" },
  { id: "c-workflows", label: "Go to Workflows", keywords: "pipeline automation chain", group: "Navigate", icon: Workflow, shortcut: ["G", "W"], run: "nav:workflows" },
  { id: "c-spending", label: "Go to Spending", keywords: "cost budget invoice money finops", group: "Navigate", icon: Wallet, shortcut: ["G", "S"], run: "nav:spending" },
  { id: "c-settings", label: "Go to Settings", keywords: "preferences configuration", group: "Navigate", icon: Settings, run: "nav:settings" },

  { id: "c-new-prompt", label: "New prompt", keywords: "create add write template", group: "Create", icon: SquarePen, shortcut: ["N"], run: "create:prompt" },
  { id: "c-new-project", label: "New project", keywords: "create add initiative", group: "Create", icon: FolderPlus, run: "create:project" },
  { id: "c-new-tool", label: "Add a tool", keywords: "create subscription track", group: "Create", icon: Boxes, run: "create:tool" },

  { id: "c-theme-light", label: "Switch to light theme", keywords: "appearance bright day", group: "Appearance", icon: Sun, run: "theme:light" },
  { id: "c-theme-dark", label: "Switch to dark theme", keywords: "appearance night", group: "Appearance", icon: Moon, run: "theme:dark" },
  { id: "c-theme-system", label: "Match system theme", keywords: "appearance auto os", group: "Appearance", icon: Monitor, run: "theme:system" },
  { id: "c-sidebar", label: "Toggle sidebar", keywords: "collapse expand rail", group: "Appearance", icon: PanelLeft, shortcut: ["["], run: "ui:sidebar" },
  { id: "c-shortcuts", label: "Keyboard shortcuts", keywords: "keys hotkeys help", group: "Appearance", icon: Keyboard, shortcut: ["?"], run: "ui:shortcuts" },

  { id: "c-export", label: "Export workspace as JSON", keywords: "download backup save data", group: "Workspace", icon: Download, run: "data:export" },
  { id: "c-reset", label: "Reset workspace to sample data", keywords: "clear wipe restore demo seed", group: "Workspace", icon: RotateCcw, run: "data:reset", danger: true },
];
