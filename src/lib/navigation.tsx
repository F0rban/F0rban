import { Gavel, Home, Library, Settings, Swords, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModelIcon } from "@/components/ui/model-icon";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  shortcut?: string;
  primary?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Seven destinations, ordered by the loop: judge what is waiting, read what
 * the evidence says, then the reference material behind it.
 */
export const NAVIGATION: NavGroup[] = [
  {
    label: "Evidence",
    items: [
      {
        href: "/",
        label: "Today",
        description: "What needs a verdict, and what the evidence changed",
        icon: Home,
        shortcut: "g d",
        primary: true,
      },
      {
        href: "/duels",
        label: "Duels",
        description: "Run a task against several models and judge it blind",
        icon: Swords,
        shortcut: "g u",
        primary: true,
      },
      {
        href: "/verdicts",
        label: "Verdicts",
        description: "Which model to use for which work, and what it saves",
        icon: Gavel,
        shortcut: "g v",
        primary: true,
      },
    ],
  },
  {
    label: "Library",
    items: [
      {
        href: "/prompts",
        label: "Prompts",
        description: "Reusable prompts with variables — the inputs to a duel",
        icon: Library,
        shortcut: "g p",
        primary: true,
      },
      {
        href: "/models",
        label: "Models",
        description: "Vendor specs beside the record each model earned",
        icon: ModelIcon,
        shortcut: "g m",
        primary: true,
      },
    ],
  },
  {
    label: "Money",
    items: [
      {
        href: "/spend",
        label: "Spend",
        description: "What routing costs you, and what the verdicts would save",
        icon: Wallet,
        shortcut: "g s",
      },
      {
        href: "/settings",
        label: "Settings",
        description: "Volumes, appearance and workspace data",
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
