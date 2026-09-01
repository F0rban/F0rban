"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  EqualApproximately,
  Eye,
  Gavel,
  Trash2,
  Trophy,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProviderMark } from "@/components/ui/provider-mark";
import { TallyMarks } from "@/components/ui/record";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCopy } from "@/hooks/use-copy";
import { blindLabel, blindOrder, costSpread } from "@/features/duels/duel-meta";
import { TASK_LABEL } from "@/lib/data/seed/duels";
import { modelRecord } from "@/lib/analytics/verdicts";
import { formatCompact, formatCurrency, formatDuration } from "@/lib/utils/format";
import { formatDate, relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

/**
 * The judging screen — where evidence is actually created.
 *
 * While a duel is pending, nothing identifies the models: no name, no provider
 * mark, no price. That is the point. If you can see that column B is the
 * expensive one you will pick it, and the record it produces is worthless.
 */
export function DuelDetail({ id }: { id: string }) {
  const router = useRouter();
  const { workspace, ready } = useWorkspace();
  const decideDuel = useWorkspaceStore((s) => s.decideDuel);
  const updateDuelEntry = useWorkspaceStore((s) => s.updateDuelEntry);
  const deleteDuel = useWorkspaceStore((s) => s.deleteDuel);
  const toast = useUiStore((s) => s.toast);
  const { copied, copy } = useCopy();

  const [reason, setReason] = useState("");
  const [pendingChoice, setPendingChoice] = useState<string | null | undefined>(undefined);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const duel = workspace?.duels.find((d) => d.id === id) ?? null;
  usePageTitle(duel?.title ?? null);

  const models = useMemo(
    () => new Map((workspace?.models ?? []).map((m) => [m.id, m])),
    [workspace],
  );
  const order = useMemo(() => (duel ? blindOrder(duel) : []), [duel]);
  // Participants in the order the user picked them, not the display order.
  const contenders = useMemo(
    () => (duel ? duel.entries.map((e) => models.get(e.modelId)) : []),
    [duel, models],
  );
  const prompt = duel?.promptId ? workspace?.prompts.find((p) => p.id === duel.promptId) : null;

  if (!ready) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-96 w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (!duel) {
    return (
      <PageContainer width="narrow" className="pt-12">
        <EmptyState
          icon={<Gavel />}
          title="Duel not found"
          description="It may have been deleted from this workspace."
          action={
            <Button variant="primary" size="sm" asChild>
              <Link href="/duels">All duels</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const decided = duel.status === "decided";
  const spread = costSpread(duel);
  const winner = duel.winnerModelId ? models.get(duel.winnerModelId) : null;

  const submit = (winnerModelId: string | null) => {
    decideDuel(duel.id, winnerModelId, reason.trim());
    const chosen = winnerModelId ? models.get(winnerModelId) : null;
    const entry = duel.entries.find((e) => e.modelId === winnerModelId);
    const dearest = duel.entries.reduce((max, e) => Math.max(max, e.cost), 0);
    toast({
      title: chosen ? `${chosen.name} won` : "Recorded as a tie",
      description:
        chosen && entry && dearest > entry.cost
          ? `And it was ${(dearest / Math.max(entry.cost, 1e-9)).toFixed(1)}× cheaper than the alternative.`
          : duel.sample
            ? "Added to the worked example."
            : "Added to your record.",
      tone: "success",
    });
  };

  return (
    <PageContainer>
      <Button variant="ghost" size="sm" className="-ml-2 mb-3" asChild>
        <Link href="/duels">
          <ArrowLeft className="size-3.5" />
          All duels
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={decided ? "neutral" : "accent"} dot>
              {decided ? "Judged" : "Awaiting a verdict"}
            </Badge>
            <Badge tone="outline">{TASK_LABEL[duel.taskType]}</Badge>
            {duel.blind && (
              <Badge tone="outline" className="gap-1">
                <Eye className="size-3" />
                Blind
              </Badge>
            )}
            {duel.sample && <Badge tone="warning">Sample duel</Badge>}
          </div>
          <h1 className="mt-2.5 text-[21px] font-semibold tracking-[-0.02em] text-ink">
            {duel.title}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-4">
            <span>Run {formatDate(duel.createdAt)}</span>
            {decided && duel.decidedAt && <span>Judged {relativeTime(duel.decidedAt)}</span>}
            {prompt && (
              <Link href={`/prompts?prompt=${prompt.id}`} className="text-accent hover:underline">
                {prompt.title}
              </Link>
            )}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete duel"
          className="shrink-0 text-negative hover:bg-negative-soft"
          onClick={() => {
            deleteDuel(duel.id);
            toast({ title: "Duel deleted", tone: "warning" });
            router.push("/duels");
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* The reveal, after judging. */}
      {decided && (
        <section className="mt-5 rounded-xl border border-line bg-surface-1 p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-accent-line/60 bg-accent-soft text-accent">
              {duel.tie ? <EqualApproximately className="size-4" /> : <Trophy className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-ink">
                {duel.tie ? "Judged indistinguishable" : `${winner?.name ?? "Unknown"} won`}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-3">
                {duel.reason || "No reason recorded."}
              </p>
            </div>
            {spread.ratio > 1.2 && (
              <p className="shrink-0 text-right">
                <span className="block font-mono text-[15px] font-semibold tabular-nums text-ink">
                  {spread.ratio.toFixed(1)}×
                </span>
                <span className="block text-[10.5px] text-ink-4">price spread</span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* How to actually run it.
          Blindness means you do not know which column is which — not that you
          do not know who is competing. You chose the models; hiding that would
          only make the thing unusable. */}
      {!decided && (
        <section className="mt-5 rounded-xl border border-line bg-surface-1 shadow-xs">
          <header className="flex flex-wrap items-center gap-2 border-b border-line-subtle px-4 py-2.5">
            <h2 className="text-[12.5px] font-semibold text-ink">Run it</h2>
            <p className="text-[11.5px] text-ink-3">
              on {contenders.map((m) => m?.name).filter(Boolean).join(" and ")} — the answers below
              are in a random order
            </p>
            {prompt && (
              <Button
                variant="secondary"
                size="xs"
                className="ml-auto"
                onClick={async () => {
                  await copy(prompt.body);
                  setCopiedIndex(-1);
                  setTimeout(() => setCopiedIndex(null), 1600);
                }}
              >
                {copied && copiedIndex === -1 ? (
                  <Check className="size-3 text-positive" strokeWidth={3} />
                ) : (
                  <Copy className="size-3" />
                )}
                Copy the prompt
              </Button>
            )}
          </header>
          <div className="px-4 py-3">
            {prompt ? (
              <pre className="mask-fade-b max-h-28 overflow-hidden whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-ink-3">
                {prompt.body}
              </pre>
            ) : (
              <p className="text-[12px] leading-relaxed text-ink-3">
                Run the task in whichever apps you already use, then come back. Pasting the answers
                is optional — if you remember which was better, just record the verdict.
              </p>
            )}
          </div>
        </section>
      )}

      {/* The entries. */}
      <div
        className={cn(
          "mt-4 grid gap-3",
          duel.entries.length === 2 && "lg:grid-cols-2",
          duel.entries.length === 3 && "lg:grid-cols-3",
          duel.entries.length >= 4 && "lg:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {order.map((entryIndex, position) => {
          const entry = duel.entries[entryIndex]!;
          const model = models.get(entry.modelId);
          const isWinner = decided && duel.winnerModelId === entry.modelId;
          const record = decided ? modelRecord(workspace!.duels, entry.modelId) : null;

          return (
            <section
              key={entry.modelId}
              className={cn(
                "flex min-w-0 flex-col rounded-xl border bg-surface-1 shadow-xs transition-colors",
                isWinner ? "border-accent" : "border-line",
              )}
            >
              <header className="flex items-center gap-2.5 border-b border-line-subtle px-3.5 py-2.5">
                {decided ? (
                  <>
                    <ProviderMark provider={model?.provider ?? "other"} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-ink">
                        {model?.name ?? entry.modelId}
                      </span>
                      {record && (
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <TallyMarks count={record.wins} label={`${record.wins} wins overall`} />
                          <span className="font-mono text-[10px] tabular-nums text-ink-4">
                            {record.wins}–{record.losses} overall
                          </span>
                        </span>
                      )}
                    </span>
                    {isWinner && (
                      <Trophy className="size-3.5 shrink-0 text-accent" aria-label="Winner" />
                    )}
                  </>
                ) : (
                  <>
                    <span className="grid size-6 shrink-0 place-items-center rounded-[6px] border border-line bg-surface-2 font-mono text-[11px] font-semibold text-ink-2">
                      {blindLabel(position)}
                    </span>
                    <span className="text-[12.5px] font-medium text-ink">
                      Answer {blindLabel(position)}
                    </span>
                  </>
                )}
              </header>

              <div className="flex min-h-0 flex-1 flex-col p-3.5">
                {decided || entry.output ? (
                  <pre className="max-h-80 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line-subtle bg-surface-2/40 p-2.5 font-mono text-[11.5px] leading-relaxed text-ink-2">
                    {entry.output || "No output was pasted for this one — only the verdict was recorded."}
                  </pre>
                ) : (
                  <Textarea
                    rows={10}
                    value={entry.output}
                    aria-label={`Paste the answer from model ${blindLabel(position)}`}
                    placeholder={`Paste answer ${blindLabel(position)} here — optional. You can judge from memory and just record the verdict.`}
                    onChange={(event) => updateDuelEntry(duel.id, entry.modelId, event.target.value)}
                    className="min-h-64 flex-1 font-mono text-[11.5px]"
                  />
                )}

                {/* Cost stays hidden until a verdict exists: seeing the price
                    is exactly the bias the blind test is there to remove. */}
                {decided && (
                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line-subtle pt-2.5">
                    {[
                      ["Cost", formatCurrency(entry.cost, { maximumFractionDigits: 4 })],
                      ["Tokens", formatCompact(entry.tokensIn + entry.tokensOut)],
                      ["Latency", formatDuration(entry.latencyMs)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-4">
                          {label}
                        </dt>
                        <dd className="mt-0.5 font-mono text-[12px] font-medium tabular-nums text-ink">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {!decided && (
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant={pendingChoice === entry.modelId ? "primary" : "secondary"}
                      size="sm"
                      className="w-full"
                      onClick={() => setPendingChoice(entry.modelId)}
                    >
                      {pendingChoice === entry.modelId && <Check className="size-3.5" strokeWidth={3} />}
                      This one won
                    </Button>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* The verdict bar. */}
      {!decided && (
        <section className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] mt-4 rounded-xl border border-line bg-overlay p-3.5 shadow-lg md:bottom-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              value={reason}
              placeholder="Why did it win? One line is enough — it is what makes the record readable later."
              aria-label="Reason for the verdict"
              onChange={(event) => setReason(event.target.value)}
              className="flex-1"
            />
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setPendingChoice(null);
                  submit(null);
                }}
              >
                <EqualApproximately className="size-3.5" />
                Indistinguishable
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={pendingChoice === undefined || pendingChoice === null}
                onClick={() => submit(pendingChoice ?? null)}
              >
                <Gavel className="size-3.5" />
                Record verdict
              </Button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-ink-4">
            {pendingChoice === undefined
              ? "Pick a winner above, or record a tie. Model names and prices stay hidden until you do."
              : "Names and prices are revealed once the verdict is in."}
          </p>
        </section>
      )}
    </PageContainer>
  );
}
