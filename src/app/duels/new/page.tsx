"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Info, Swords } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Skeleton } from "@/components/ui/skeleton";
import { TallyMarks } from "@/components/ui/record";
import { useWorkspace } from "@/hooks/use-workspace";
import { useInitialSearchParam } from "@/hooks/use-initial-search-param";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { TASK_DESCRIPTION, TASK_LABEL, TASK_TYPES } from "@/lib/data/seed/duels";
import { modelRecord, verdictFor } from "@/lib/analytics/verdicts";
import { evidenceMode } from "@/lib/analytics/evidence";
import { priceRun } from "@/lib/providers/pricing";
import { runnerFor } from "@/lib/providers/registry";
import { estimateTokens } from "@/lib/prompts/template";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { TaskType } from "@/lib/data/types";

const MAX_MODELS = 4;

export default function NewDuelPage() {
  const router = useRouter();
  const { workspace, ready } = useWorkspace();
  const startDuel = useWorkspaceStore((s) => s.startDuel);
  const toast = useUiStore((s) => s.toast);

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("code-review");
  const [promptId, setPromptId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);

  // `?task=` and `?prompt=` prefill the form — from Today, from a reveal, from
  // a prompt. Read after mount so the route still prerenders.
  const taskParam = useInitialSearchParam("task");
  const promptParam = useInitialSearchParam("prompt");
  useEffect(() => {
    if (taskParam && (TASK_TYPES as string[]).includes(taskParam)) {
      setTaskType(taskParam as TaskType);
    }
  }, [taskParam]);
  useEffect(() => {
    if (promptParam) setPromptId(promptParam);
  }, [promptParam]);

  const models = useMemo(() => workspace?.models ?? [], [workspace]);
  const profile = workspace?.taskProfiles.find((p) => p.taskType === taskType);

  // Open on the two models this task type already has evidence about — the
  // fastest way to add a result that actually moves a verdict.
  const suggested = useMemo(() => {
    if (!workspace) return [];
    const verdict = verdictFor(taskType, workspace.duels, workspace.models, profile);
    const fromEvidence = verdict.standings.slice(0, 2).map((s) => s.modelId);
    if (fromEvidence.length >= 2) return fromEvidence;
    const favourites = workspace.models.filter((m) => m.favorite).map((m) => m.id);
    return [...new Set([...fromEvidence, ...favourites])].slice(0, 2);
  }, [workspace, taskType, profile]);

  // Seed the model selection once, after the task parameter (if any) has been
  // applied, so the suggestion is for the kind of work the link asked for.
  if (ready && !seeded && taskParam !== undefined) {
    setSeeded(true);
    setSelected(suggested);
  }

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_MODELS
          ? prev
          : [...prev, id],
    );

  const prompt = workspace?.prompts.find((p) => p.id === promptId);
  const tokensIn = prompt
    ? estimateTokens(prompt.body)
    : (profile?.avgTokensIn ?? 2_000);
  const tokensOut = profile?.avgTokensOut ?? 800;

  const estimate = selected.reduce((sum, id) => {
    const model = models.find((m) => m.id === id);
    return model ? sum + priceRun(model, tokensIn, tokensOut) : sum;
  }, 0);

  const canStart = title.trim().length > 0 && selected.length >= 2;
  const firstOwn = workspace ? evidenceMode(workspace) === "example" : false;

  const submit = async () => {
    if (!canStart) return;
    // Each entry comes from whichever runner can drive that model. Today that
    // is always the manual runner — a priced estimate the user completes by
    // hand — and a connected provider slots in here without touching the form.
    const entries = await Promise.all(
      selected.map(async (modelId) => {
        const model = models.find((m) => m.id === modelId)!;
        const result = await runnerFor(model.provider).run({
          model,
          prompt: prompt?.body ?? "",
          expectedTokensIn: tokensIn,
          expectedTokensOut: tokensOut,
        });
        return { modelId, ...result };
      }),
    );
    const id = startDuel({
      title: title.trim(),
      taskType,
      promptId: promptId || null,
      projectId: null,
      blind: true,
      entries,
    });
    toast({
      title: firstOwn ? "Your record starts here" : "Duel started",
      description: firstOwn
        ? "The worked example is cleared. Run the prompt on each model, then judge them blind."
        : "Run the prompt on each model, then judge them blind.",
      tone: "success",
    });
    router.push(`/duels/${id}`);
  };

  if (!ready) {
    return (
      <PageContainer width="narrow">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-4 h-96 w-full rounded-xl" />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow">
      <Button variant="ghost" size="sm" className="-ml-2 mb-3" asChild>
        <Link href="/duels">
          <ArrowLeft className="size-3.5" />
          All duels
        </Link>
      </Button>

      <PageHeader
        title="Run a duel"
        description="One real task, several models, judged with the names hidden. That last part is what makes the record worth anything."
      />

      <div className="mt-5 space-y-4">
        <section className="rounded-xl border border-line bg-surface-1 p-4 shadow-xs">
          <Field label="What is the task?" htmlFor="duel-title" required>
            <Input
              id="duel-title"
              autoFocus
              value={title}
              placeholder="Review the payment webhook signature check"
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
              }}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Kind of work" hint="Groups the evidence" htmlFor="duel-task">
              <Select
                id="duel-task"
                value={taskType}
                onChange={(event) => setTaskType(event.target.value as TaskType)}
              >
                {TASK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TASK_LABEL[type]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prompt" hint="Optional" htmlFor="duel-prompt">
              <Select
                id="duel-prompt"
                value={promptId}
                onChange={(event) => setPromptId(event.target.value)}
              >
                <option value="">None — ad hoc task</option>
                {(workspace?.prompts ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <p className="mt-2 text-[11.5px] text-ink-4">{TASK_DESCRIPTION[taskType]}</p>
        </section>

        <section className="overflow-hidden rounded-xl border border-line bg-surface-1 shadow-xs">
          <header className="flex items-baseline justify-between gap-3 border-b border-line-subtle px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-ink">Which models?</h2>
              <p className="mt-0.5 text-xs text-ink-3">
                Two is enough. Four is the most a blind comparison stays honest at.
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-4">
              {selected.length}/{MAX_MODELS}
            </span>
          </header>

          <ul className="max-h-80 divide-y divide-line-subtle overflow-y-auto">
            {models.map((model) => {
              const active = selected.includes(model.id);
              const record = workspace ? modelRecord(workspace.duels, model.id) : null;
              const disabled = !active && selected.length >= MAX_MODELS;
              return (
                <li key={model.id}>
                  <button
                    type="button"
                    onClick={() => toggle(model.id)}
                    disabled={disabled}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      active ? "bg-accent-soft/40" : "hover:bg-surface-2/60",
                      disabled && "opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors",
                        active
                          ? "border-accent bg-accent text-accent-ink"
                          : "border-line-strong",
                      )}
                    >
                      {active && <Check className="size-3" strokeWidth={3.5} />}
                    </span>
                    <ProviderMark provider={model.provider} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-ink">
                        {model.name}
                      </span>
                      <span className="block truncate font-mono text-[10.5px] tabular-nums text-ink-4">
                        ${model.inputPrice} / ${model.outputPrice} per M
                      </span>
                    </span>
                    {record && record.played > 0 && (
                      <span className="flex shrink-0 items-center gap-1.5">
                        <TallyMarks count={record.wins} label={`${record.wins} wins`} />
                        <span className="font-mono text-[10.5px] tabular-nums text-ink-4">
                          {record.wins}–{record.losses}
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-line bg-surface-1 p-4 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 size-3.5 shrink-0 text-ink-4" />
            <p className="text-[11.5px] leading-relaxed text-ink-3">
              {firstOwn && (
                <>
                  <span className="font-medium text-ink">This is your first own duel.</span> Starting
                  it replaces the worked example with your record — your prompts and models stay.{" "}
                </>
              )}
              Bench does not call the providers. Run the prompt yourself in whichever apps you
              already use, paste the answers back — or skip pasting and just record who won. The
              verdict is the part that compounds.
              {estimate > 0 && (
                <>
                  {" "}
                  This comparison would cost roughly{" "}
                  <span className="font-mono font-medium text-ink">
                    {formatCurrency(estimate, { maximumFractionDigits: 4 })}
                  </span>{" "}
                  in API terms.
                </>
              )}
            </p>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" asChild>
            <Link href="/duels">Cancel</Link>
          </Button>
          <Button variant="primary" size="md" disabled={!canStart} onClick={() => void submit()}>
            <Swords className="size-3.5" />
            Start duel
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
