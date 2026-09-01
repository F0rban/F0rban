import {
  Boxes,
  Cpu,
  FolderKanban,
  LayoutDashboard,
  Library,
  Settings,
  Wallet,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Shown in the collapsed rail tooltip and the shortcuts sheet. */
  description: string;
  icon: LucideIcon;
  /** Sequence hotkey, e.g. "g p". */
  shortcut?: string;
  /** Included in the mobile bottom bar. */
  primary?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        href: "/",
        label: "Dashboard",
        description: "Spend, activity and what needs attention today",
        icon: LayoutDashboard,
        shortcut: "g d",
        primary: true,
      },
      {
        href: "/projects",
        label: "Projects",
        description: "Objectives, tasks, and the tools each project uses",
        icon: FolderKanban,
        shortcut: "g r",
        primary: true,
      },
    ],
  },
  {
    label: "Library",
    items: [
      {
        href: "/prompts",
        label: "Prompt Vault",
        description: "Reusable prompts with variables and version history",
        icon: Library,
        shortcut: "g p",
        primary: true,
      },
      {
        href: "/tools",
        label: "Tools",
        description: "Every AI subscription and API, with cost and usage",
        icon: Boxes,
        shortcut: "g t",
        primary: true,
      },
      {
        href: "/models",
        label: "Model Lab",
        description: "Compare capability, price and latency across models",
        icon: Cpu,
        shortcut: "g m",
        primary: true,
      },
      {
        href: "/workflows",
        label: "Workflows",
        description: "Multi-step AI pipelines you can step through",
        icon: Workflow,
        shortcut: "g w",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/spending",
        label: "Spending",
        description: "Budget, forecast and where the money actually goes",
        icon: Wallet,
        shortcut: "g s",
      },
      {
        href: "/settings",
        label: "Settings",
        description: "Budget, appearance and workspace data",
        icon: Settings,
        shortcut: "g ,",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAVIGATION.flatMap((group) => group.items);

export const PRIMARY_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter((item) => item.primary);

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") return ALL_NAV_ITEMS[0];
  return ALL_NAV_ITEMS.filter((item) => item.href !== "/").find((item) =>
    pathname.startsWith(item.href),
  );
}
