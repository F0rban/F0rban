"use client";

import { useRouter } from "next/navigation";
import { SquarePen, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils/cn";

/** The one primary action in the chrome. Everything else is contextual. */
export function QuickCreate({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size={collapsed ? "icon" : "md"}
          aria-label="Create"
          className={cn(!collapsed && "flex-1", className)}
        >
          <Swords className="size-4" strokeWidth={2.2} />
          {!collapsed && "Run a duel"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? "start" : "center"} side="top" className="min-w-52">
        <DropdownMenuLabel>Create</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => router.push("/duels/new")}>
          <Swords />
          Run a duel
          <DropdownMenuShortcut>D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/prompts?new=1")}>
          <SquarePen />
          New prompt
          <DropdownMenuShortcut>N</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
