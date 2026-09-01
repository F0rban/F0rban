"use client";

import { useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import type { Project, SpendEntry, SpendKind, Tool } from "@/lib/data/types";
import { PROVIDERS } from "@/lib/data/seed/providers";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import { FilterMenu } from "@/components/ui/filter-bar";
import { formatCompact, formatCurrency } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const KIND_LABEL: Record<SpendKind, string> = {
  subscription: "Subscription",
  usage: "Usage",
  credit: "Credit",
  "one-off": "One-off",
};

const KIND_TONE: Record<SpendKind, "neutral" | "info" | "positive" | "accent"> = {
  subscription: "accent",
  usage: "info",
  credit: "positive",
  "one-off": "neutral",
};

const PAGE = 40;

/** The ledger. Sorted newest first, filterable, and never paginated away. */
export function TransactionsTable({
  entries,
  projects,
  tools,
}: {
  entries: SpendEntry[];
  projects: Project[];
  tools: Tool[];
}) {
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<string[]>([]);
  const [providerFilter, setProviderFilter] = useState<string[]>([]);
  const [limit, setLimit] = useState(PAGE);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const toolById = useMemo(() => new Map(tools.map((t) => [t.id, t])), [tools]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return entries
      .filter((entry) => {
        if (kinds.length && !kinds.includes(entry.kind)) return false;
        if (providerFilter.length && !providerFilter.includes(entry.provider)) return false;
        if (!term) return true;
        const project = entry.projectId ? projectById.get(entry.projectId)?.name : "";
        return `${entry.description} ${PROVIDERS[entry.provider].name} ${project}`
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || Math.abs(b.amount) - Math.abs(a.amount));
  }, [entries, kinds, providerFilter, query, projectById]);

  const providerOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) counts.set(entry.provider, (counts.get(entry.provider) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ value: id, label: PROVIDERS[id as keyof typeof PROVIDERS].name, count }));
  }, [entries]);

  const shown = filtered.slice(0, limit);
  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface-1 shadow-xs">
      <header className="flex flex-wrap items-center gap-2 border-b border-line-subtle p-3">
        <div>
          <h3 className="text-[13px] font-semibold text-ink">Transactions</h3>
          <p className="mt-0.5 text-[11.5px] text-ink-3">
            <span className="font-mono tabular-nums">{filtered.length}</span> rows ·{" "}
            <span className="font-mono font-medium tabular-nums text-ink">
              {formatCurrency(filteredTotal)}
            </span>
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search transactions…"
            className="w-full sm:w-52"
            ariaLabel="Search transactions"
          />
          <FilterMenu
            label="Type"
            selected={kinds}
            onChange={setKinds}
            options={(Object.keys(KIND_LABEL) as SpendKind[]).map((kind) => ({
              value: kind,
              label: KIND_LABEL[kind],
              count: entries.filter((e) => e.kind === kind).length,
            }))}
          />
          <FilterMenu
            label="Provider"
            selected={providerFilter}
            onChange={setProviderFilter}
            options={providerOptions}
          />
        </div>
      </header>

      {shown.length === 0 ? (
        <EmptyState
          className="m-3"
          compact
          icon={<Receipt />}
          title="No transactions match"
          description="Try a different range or clear the filters."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left">
              <caption className="sr-only">Spend transactions, newest first</caption>
              <thead>
                <tr className="border-b border-line-subtle text-[10.5px] uppercase tracking-[0.07em] text-ink-4">
                  <th scope="col" className="px-3 py-2 font-medium">Date</th>
                  <th scope="col" className="px-3 py-2 font-medium">Description</th>
                  <th scope="col" className="px-3 py-2 font-medium">Project</th>
                  <th scope="col" className="px-3 py-2 font-medium">Type</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Tokens</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {shown.map((entry) => {
                  const project = entry.projectId ? projectById.get(entry.projectId) : null;
                  const tool = entry.toolId ? toolById.get(entry.toolId) : null;
                  return (
                    <tr key={entry.id} className="transition-colors hover:bg-surface-2/50">
                      <td className="whitespace-nowrap px-3 py-1.5 font-mono text-[11.5px] tabular-nums text-ink-4">
                        {formatDate(entry.date, "medium")}
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="flex items-center gap-2">
                          <ProviderMark
                            provider={entry.provider}
                            size="xs"
                            fallbackName={tool?.name}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[12px] text-ink-2">
                              {entry.description}
                            </span>
                            <span className="block truncate text-[10.5px] text-ink-4">
                              {PROVIDERS[entry.provider].name}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        {project ? (
                          <span
                            className="rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-medium"
                            style={{
                              color: `var(--series-${project.series})`,
                              backgroundColor: `color-mix(in oklch, var(--series-${project.series}) 12%, transparent)`,
                            }}
                          >
                            {project.code}
                          </span>
                        ) : (
                          <span className="text-[11px] text-ink-4">—</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        <Badge tone={KIND_TONE[entry.kind]}>{KIND_LABEL[entry.kind]}</Badge>
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[11.5px] tabular-nums text-ink-4">
                        {entry.tokensIn !== null
                          ? formatCompact(entry.tokensIn + (entry.tokensOut ?? 0))
                          : "—"}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-1.5 text-right font-mono text-[12px] font-medium tabular-nums",
                          entry.amount < 0 ? "text-positive" : "text-ink",
                        )}
                      >
                        {formatCurrency(entry.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > shown.length && (
            <div className="border-t border-line-subtle p-2.5 text-center">
              <Button variant="secondary" size="sm" onClick={() => setLimit((n) => n + PAGE)}>
                Show {Math.min(PAGE, filtered.length - shown.length)} more
                <span className="font-mono text-[10.5px] text-ink-4">
                  {shown.length}/{filtered.length}
                </span>
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
