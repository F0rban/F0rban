"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  CornerDownLeft,
  Search,
  Star,
  Terminal,
} from "lucide-react";
import { COMMANDS, type CommandAction, type CommandRunId } from "./commands";
import { CommandPreview } from "./command-preview";
import { useUiStore } from "@/lib/store/ui";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useWorkspace } from "@/hooks/use-workspace";
import { buildSearchIndex, groupHits, searchRecords, type SearchHit } from "@/lib/search";
import { fuzzyMatch, highlightSegments } from "@/lib/search/fuzzy";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/utils/cn";
import { Kbd } from "@/components/ui/kbd";
import { ProviderMark } from "@/components/ui/provider-mark";
import type { EntityType } from "@/lib/data/types";

type Row =
  | { kind: "command"; id: string; command: CommandAction; positions: number[] }
  | { kind: "record"; id: string; hit: SearchHit };

interface Section {
  label: string;
  rows: Row[];
}

const TYPE_ICON_TONE: Record<EntityType, string> = {
  prompt: "text-series-1",
  project: "text-series-3",
  tool: "text-series-2",
  model: "text-series-6",
  duel: "text-series-5",
  spend: "text-series-4",
};

function Highlighted({ text, positions }: { text: string; positions: number[] }) {
  const segments = highlightSegments(text, positions);
  return (
    <>
      {segments.map((segment, i) =>
        segment.match ? (
          <mark key={i} className="bg-transparent font-semibold text-accent">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  );
}

/**
 * Global command palette.
 *
 * Searches every entity in the workspace and every action the app can perform,
 * in one list. Typing ">" narrows to actions only. The right-hand pane previews
 * whatever is highlighted, so the palette answers questions without navigating.
 */
export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const toast = useUiStore((s) => s.toast);
  const { workspace } = useWorkspace();
  const resetWorkspace = useWorkspaceStore((s) => s.reset);
  const updatePreferences = useWorkspaceStore((s) => s.updatePreferences);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commandMode = query.startsWith(">");
  const term = commandMode ? query.slice(1).trim() : query.trim();

  const index = useMemo(() => (workspace ? buildSearchIndex(workspace) : []), [workspace]);

  /** Entities the user genuinely touched most recently, from the activity log. */
  const recentIds = useMemo(() => {
    if (!workspace) return [];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const event of workspace.activity) {
      if (!event.entityId || seen.has(event.entityId)) continue;
      seen.add(event.entityId);
      ids.push(event.entityId);
      if (ids.length >= 6) break;
    }
    return ids;
  }, [workspace]);

  const sections = useMemo<Section[]>(() => {
    type ScoredCommand = Extract<Row, { kind: "command" }> & { score: number };

    const scoredCommands: ScoredCommand[] = [];
    for (const command of COMMANDS) {
      const match = fuzzyMatch(term, `${command.label} ${command.keywords}`);
      if (!match) continue;
      const labelMatch = fuzzyMatch(term, command.label);
      scoredCommands.push({
        kind: "command",
        id: command.id,
        command,
        positions: labelMatch?.positions ?? [],
        score: (labelMatch?.score ?? 0) * 1.4 + match.score,
      });
    }

    const matchedCommands: Row[] = scoredCommands
      .sort((a, b) => b.score - a.score)
      .slice(0, commandMode ? 20 : term ? 5 : 6);

    if (commandMode) {
      const byGroup = new Map<string, Row[]>();
      for (const row of scoredCommands.slice(0, 20)) {
        byGroup.set(row.command.group, [...(byGroup.get(row.command.group) ?? []), row]);
      }
      return [...byGroup.entries()].map(([label, rows]) => ({ label, rows }));
    }

    if (!term) {
      const recordById = new Map(index.map((r) => [r.id, r]));
      const recent = recentIds
        .map((id) => recordById.get(id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
        .slice(0, 5)
        .map<Row>((record) => ({
          kind: "record",
          id: record.id,
          hit: { ...record, score: 0, positions: [] },
        }));

      const favorites = index
        .filter((r) => r.favorite && !recentIds.includes(r.id))
        .sort((a, b) => b.boost - a.boost)
        .slice(0, 5)
        .map<Row>((record) => ({
          kind: "record",
          id: record.id,
          hit: { ...record, score: 0, positions: [] },
        }));

      return [
        ...(recent.length ? [{ label: "Recent", rows: recent }] : []),
        ...(favorites.length ? [{ label: "Starred", rows: favorites }] : []),
        { label: "Actions", rows: matchedCommands },
      ];
    }

    const hits = searchRecords(index, term, { limit: 24 });
    const grouped = groupHits(hits).map<Section>((group) => ({
      label: group.label === "Prompt" ? "Prompts" : `${group.label}s`,
      rows: group.hits.map<Row>((hit) => ({ kind: "record", id: hit.id, hit })),
    }));

    return matchedCommands.length
      ? [...grouped, { label: "Actions", rows: matchedCommands }]
      : grouped;
  }, [term, commandMode, index, recentIds]);

  const flatRows = useMemo(() => sections.flatMap((section) => section.rows), [sections]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, sections]);

  const runCommand = useCallback(
    (id: CommandRunId) => {
      const routes: Partial<Record<CommandRunId, string>> = {
        "nav:dashboard": "/",
        "nav:projects": "/projects",
        "nav:prompts": "/prompts",
        "nav:tools": "/tools",
        "nav:models": "/models",
        "nav:workflows": "/workflows",
        "nav:spending": "/spending",
        "nav:settings": "/settings",
        "create:prompt": "/prompts?new=1",
        "create:project": "/projects?new=1",
        "create:tool": "/tools?new=1",
      };

      if (routes[id]) {
        router.push(routes[id]!);
        return;
      }

      switch (id) {
        case "theme:light":
        case "theme:dark":
        case "theme:system": {
          const mode = id.split(":")[1] as "light" | "dark" | "system";
          applyTheme(mode);
          updatePreferences({ theme: mode });
          toast({ title: `Theme set to ${mode}`, tone: "success" });
          break;
        }
        case "ui:sidebar":
          toggleSidebar();
          break;
        case "ui:shortcuts":
          setShortcutsOpen(true);
          break;
        case "data:export": {
          if (!workspace) break;
          const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `command-center-workspace-${new Date().toISOString().slice(0, 10)}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
          toast({ title: "Workspace exported", description: "Downloaded as JSON", tone: "success" });
          break;
        }
        case "data:reset":
          void resetWorkspace().then(() =>
            toast({
              title: "Workspace reset",
              description: "Sample data restored",
              tone: "warning",
            }),
          );
          break;
      }
    },
    [router, toast, toggleSidebar, setShortcutsOpen, updatePreferences, workspace, resetWorkspace],
  );

  const activate = useCallback(
    (row: Row) => {
      setOpen(false);
      if (row.kind === "command") runCommand(row.command.run);
      else router.push(row.hit.href);
    },
    [router, runCommand, setOpen],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || (event.key === "n" && event.ctrlKey)) {
      event.preventDefault();
      setActiveIndex((i) => (flatRows.length ? (i + 1) % flatRows.length : 0));
    } else if (event.key === "ArrowUp" || (event.key === "p" && event.ctrlKey)) {
      event.preventDefault();
      setActiveIndex((i) => (flatRows.length ? (i - 1 + flatRows.length) % flatRows.length : 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(0, flatRows.length - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const row = flatRows[activeIndex];
      if (row) activate(row);
    } else if (event.key === "Backspace" && query === ">") {
      setQuery("");
    }
  };

  const activeRow = flatRows[activeIndex];
  let cursor = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim backdrop-blur-[3px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          aria-label="Command palette"
          className={cn(
            "fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-1.5rem)] max-w-2xl -translate-x-1/2",
            "overflow-hidden rounded-xl border border-line bg-overlay shadow-lg",
            "data-[state=open]:animate-pop sm:top-[15vh] lg:max-w-3xl",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Search and commands</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search prompts, projects, tools, models and workflows, or type an angle bracket to run a
            command.
          </DialogPrimitive.Description>

          <div className="flex h-12 items-center gap-2.5 border-b border-line px-3.5">
            {commandMode ? (
              <Terminal className="size-4 shrink-0 text-accent" />
            ) : (
              <Search className="size-4 shrink-0 text-ink-4" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={commandMode ? "Run a command…" : "Search everything, or type > for commands"}
              aria-label="Search"
              aria-autocomplete="list"
              role="combobox"
              aria-expanded
              aria-controls="command-results"
              className="h-full flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-4"
            />
            {query && (
              <span className="hidden font-mono text-[10.5px] tabular-nums text-ink-4 sm:block">
                {flatRows.length} result{flatRows.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="flex min-h-0">
            <div
              ref={listRef}
              id="command-results"
              role="listbox"
              aria-label="Results"
              className="max-h-[min(58vh,26rem)] min-w-0 flex-1 overflow-y-auto p-1.5"
            >
              {flatRows.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-[13px] text-ink-2">No matches for “{term}”</p>
                  <p className="mt-1 text-xs text-ink-4">
                    Try a shorter term, or type <span className="font-mono text-ink-3">&gt;</span> to
                    browse commands.
                  </p>
                </div>
              ) : (
                sections.map((section) => (
                  <div key={section.label} className="mb-1 last:mb-0">
                    <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4">
                      {section.label}
                    </p>
                    <ul>
                      {section.rows.map((row) => {
                        cursor += 1;
                        const isActive = cursor === activeIndex;
                        const rowIndex = cursor;
                        return (
                          <li key={row.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              data-active={isActive || undefined}
                              onPointerMove={() => setActiveIndex(rowIndex)}
                              onClick={() => activate(row)}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                                isActive ? "bg-surface-2" : "hover:bg-surface-2/60",
                              )}
                            >
                              {row.kind === "command" ? (
                                <row.command.icon
                                  className={cn(
                                    "size-4 shrink-0",
                                    row.command.danger ? "text-negative" : "text-ink-4",
                                  )}
                                />
                              ) : row.hit.type === "tool" || row.hit.type === "model" ? (
                                <ProviderMark
                                  provider={
                                    (workspace?.tools.find((t) => t.id === row.hit.id)?.provider ??
                                      workspace?.models.find((m) => m.id === row.hit.id)?.provider ??
                                      "other")
                                  }
                                  size="xs"
                                />
                              ) : (
                                <span
                                  className={cn(
                                    "grid size-5 shrink-0 place-items-center rounded-[5px] border border-line bg-surface-2",
                                    TYPE_ICON_TONE[row.hit.type],
                                  )}
                                >
                                  <span className="font-mono text-[8.5px] font-semibold uppercase">
                                    {row.hit.type[0]}
                                  </span>
                                </span>
                              )}

                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block truncate text-[13px]",
                                    isActive ? "text-ink" : "text-ink-2",
                                    row.kind === "command" && row.command.danger && "text-negative",
                                  )}
                                >
                                  {row.kind === "command" ? (
                                    <Highlighted text={row.command.label} positions={row.positions} />
                                  ) : (
                                    <Highlighted text={row.hit.title} positions={row.hit.positions} />
                                  )}
                                </span>
                                {row.kind === "record" && row.hit.subtitle && (
                                  <span className="block truncate text-[11px] text-ink-4">
                                    {row.hit.subtitle}
                                  </span>
                                )}
                              </span>

                              {row.kind === "record" && row.hit.favorite && (
                                <Star className="size-3 shrink-0 fill-accent text-accent" />
                              )}
                              {row.kind === "command" && row.command.shortcut && (
                                <span className="hidden shrink-0 items-center gap-1 sm:flex">
                                  {row.command.shortcut.map((key) => (
                                    <Kbd key={key}>{key}</Kbd>
                                  ))}
                                </span>
                              )}
                              {isActive && (
                                <ArrowRight className="size-3.5 shrink-0 text-ink-4" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <CommandPreview row={activeRow} workspace={workspace} />
          </div>

          <div className="flex h-9 items-center gap-4 border-t border-line bg-surface-2/40 px-3.5 text-[10.5px] text-ink-4">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>
                <CornerDownLeft className="size-2.5" />
              </Kbd>
              open
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Kbd>&gt;</Kbd>
              commands
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <Kbd>esc</Kbd>
              close
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
