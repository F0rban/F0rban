"use client";

import { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Check, Eye, Gavel, TrendingUp } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";
import { TallyMarks } from "@/components/ui/record";
import { allVerdicts, routingSummary } from "@/lib/analytics/verdicts";
import { TASK_LABEL, TASK_TYPES } from "@/lib/data/seed/duels";
import { formatCurrency, formatDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { SAMPLE_ANSWERS, SAMPLE_DIFF } from "./sample-duel";
import type { TaskType } from "@/lib/data/types";

const STEPS = [
  { id: "judge", label: "Judge one", hint: "Twenty seconds" },
  { id: "work", label: "Your work", hint: "What you use AI for" },
  { id: "payoff", label: "The payoff", hint: "What it is worth" },
] as const;

/**
 * First run.
 *
 * Step one is not a welcome screen — it is a real blind comparison. The user
 * picks an answer before they know what produced it, and the reveal makes the
 * entire product argument in one sentence. Everything after that is setup.
 */
export function OnboardingFlow() {
  const { workspace } = useWorkspace();
  const completeOnboarding = useWorkspaceStore((s) => s.completeOnboarding);
  const toast = useUiStore((s) => s.toast);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([
    "code-review",
    "classification",
    "summarisation",
  ]);

  // Presentation order is fixed per session but not alphabetical, so the
  // expensive answer is not reliably first.
  const order = useMemo(() => (Math.random() < 0.5 ? [0, 1] : [1, 0]), []);

  const payoff = useMemo(() => {
    if (!workspace) return null;
    const verdicts = allVerdicts(
      workspace.duels,
      workspace.models,
      workspace.taskProfiles,
      TASK_TYPES,
    );
    return {
      ...routingSummary(verdicts),
      judged: workspace.duels.filter((d) => d.status === "decided").length,
      open: workspace.duels.filter((d) => d.status === "pending").length,
    };
  }, [workspace]);

  if (!workspace) return null;

  const chosen = picked ? SAMPLE_ANSWERS.find((a) => a.id === picked)! : null;
  const other = picked ? SAMPLE_ANSWERS.find((a) => a.id !== picked)! : null;
  const cheaperWon = chosen && other ? chosen.cost < other.cost : false;

  const finish = () => {
    completeOnboarding({ displayName: name.trim(), focusModelIds: [] });
    toast({
      title: "Bench is ready",
      description:
        "It opens on a worked example so you can see the shape. Your first own duel replaces it.",
      tone: "success",
    });
  };

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-canvas/85 backdrop-blur-md" />
        <DialogPrimitive.Content
          aria-label="Set up Bench"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-[71] flex w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2",
            "max-h-[min(93dvh,50rem)] flex-col overflow-hidden rounded-2xl border border-line",
            "bg-surface-1 shadow-lg data-[state=open]:animate-pop",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Set up Bench</DialogPrimitive.Title>

          <header className="flex shrink-0 items-center gap-4 border-b border-line-subtle px-5 py-3.5">
            <span className="flex items-center gap-2.5 text-accent">
              <Logo size={20} />
              <span className="text-[13px] font-semibold tracking-[-0.01em] text-ink">Bench</span>
            </span>
            <ol className="ml-auto flex items-center gap-1">
              {STEPS.map((s, i) => (
                <li key={s.id} className="flex items-center gap-1">
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border font-mono text-[9.5px] font-semibold transition-colors",
                      i < step && "border-accent bg-accent text-accent-ink",
                      i === step && "border-accent text-accent",
                      i > step && "border-line text-ink-4",
                    )}
                  >
                    {i < step ? <Check className="size-2.5" strokeWidth={3.5} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[11.5px] sm:block",
                      i === step ? "font-medium text-ink" : "text-ink-4",
                    )}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-line" />}
                </li>
              ))}
            </ol>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {/* 1 — the blind judgement */}
            {step === 0 && (
              <div className="animate-rise">
                {!picked ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-line/60 bg-accent-soft px-2 py-0.5 text-[10.5px] font-medium text-accent">
                      <Eye className="size-3" />
                      Blind — model names hidden
                    </span>
                    <h2 className="mt-3 text-balance text-[22px] font-semibold leading-snug tracking-[-0.025em] text-ink">
                      Which of these is the better code review?
                    </h2>
                    <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-3">
                      A sample pair, so you can see how judging works. Two models reviewed the same
                      function. Pick the one you would rather have received.
                    </p>

                    <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface-2/50 p-3 font-mono text-[11px] leading-relaxed text-ink-3">
                      {SAMPLE_DIFF}
                    </pre>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {order.map((index) => {
                        const answer = SAMPLE_ANSWERS[index]!;
                        return (
                          <button
                            key={answer.id}
                            type="button"
                            onClick={() => setPicked(answer.id)}
                            className={cn(
                              "group flex flex-col rounded-xl border border-line bg-surface-1 p-3.5 text-left",
                              "transition-[border-color,box-shadow,transform] duration-200",
                              "hover:-translate-y-px hover:border-accent hover:shadow-md",
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <span className="grid size-6 place-items-center rounded-[6px] border border-line bg-surface-2 font-mono text-[11px] font-semibold text-ink-2">
                                {answer.id.toUpperCase()}
                              </span>
                              <span className="text-[12.5px] font-medium text-ink">
                                Answer {answer.id.toUpperCase()}
                              </span>
                              <span className="ml-auto text-[11.5px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                                Pick this
                              </span>
                            </span>
                            <span className="mask-fade-b mt-2.5 max-h-72 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-2">
                              {answer.body}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="animate-rise">
                    <span className="grid size-10 place-items-center rounded-xl border border-accent-line/60 bg-accent-soft text-accent">
                      <Gavel className="size-5" />
                    </span>
                    <h2 className="mt-3.5 text-balance text-[22px] font-semibold leading-snug tracking-[-0.025em] text-ink">
                      You picked {chosen!.id.toUpperCase()}. That was{" "}
                      <span className="text-accent">{chosen!.modelName}</span>.
                    </h2>
                    <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-3">
                      {cheaperWon ? (
                        <>
                          It costs{" "}
                          <span className="font-medium text-ink">
                            {(other!.cost / chosen!.cost).toFixed(1)}× less
                          </span>{" "}
                          than the answer you passed over — {other!.modelName}, at $
                          {other!.inputPrice}/${other!.outputPrice} per million tokens against $
                          {chosen!.inputPrice}/${chosen!.outputPrice}. If that holds across your
                          work, you are paying for a difference you cannot see.
                        </>
                      ) : (
                        <>
                          It costs{" "}
                          <span className="font-medium text-ink">
                            {(chosen!.cost / other!.cost).toFixed(1)}× more
                          </span>{" "}
                          than {other!.modelName}. Sometimes the expensive one really is better —
                          the point is knowing which times, on your work, rather than guessing.
                        </>
                      )}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {SAMPLE_ANSWERS.map((answer) => (
                        <div
                          key={answer.id}
                          className={cn(
                            "rounded-xl border p-3.5",
                            answer.id === picked
                              ? "border-accent bg-accent-soft/30"
                              : "border-line bg-surface-1",
                          )}
                        >
                          <p className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
                            {answer.modelName}
                            {answer.id === picked && (
                              <span className="rounded-[3px] bg-accent px-1 text-[9.5px] font-semibold text-accent-ink">
                                your pick
                              </span>
                            )}
                          </p>
                          <dl className="mt-2 grid grid-cols-3 gap-2">
                            {[
                              ["Cost", formatCurrency(answer.cost, { maximumFractionDigits: 4 })],
                              ["Latency", formatDuration(answer.latencyMs)],
                              ["Per M in", `$${answer.inputPrice}`],
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
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 rounded-lg border border-line-subtle bg-surface-2/40 p-3 text-[12px] leading-relaxed text-ink-3">
                      That is the whole mechanic. One task, several models, names hidden, one click.
                      Bench keeps the result — and after a few dozen of them it can tell you which
                      model to use for which kind of work, and what your habits cost.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2 — what they actually do */}
            {step === 1 && (
              <div className="animate-rise">
                <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">
                  What do you use AI for?
                </h2>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-3">
                  Verdicts are kept per kind of work, because the answer is different for each one.
                  A model that wins your code reviews may lose your long-form writing.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {TASK_TYPES.map((type) => {
                    const active = taskTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setTaskTypes((prev) =>
                            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
                          )
                        }
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors duration-150",
                          active
                            ? "border-accent bg-accent-soft/50"
                            : "border-line bg-surface-1 hover:border-line-strong hover:bg-surface-2",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors",
                            active ? "border-accent bg-accent text-accent-ink" : "border-line",
                          )}
                        >
                          {active && <Check className="size-2.5" strokeWidth={3.5} />}
                        </span>
                        <span className="text-[12.5px] text-ink">{TASK_LABEL[type]}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 max-w-xs">
                  <label
                    htmlFor="onboarding-name"
                    className="mb-1.5 block text-[11.5px] font-medium text-ink-2"
                  >
                    What should we call you? <span className="text-ink-4">Optional</span>
                  </label>
                  <Input
                    id="onboarding-name"
                    value={name}
                    placeholder="Alex"
                    autoComplete="given-name"
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 3 — what it is worth, honestly labelled */}
            {step === 2 && payoff && (
              <div className="animate-rise">
                <span className="grid size-10 place-items-center rounded-xl border border-accent-line/60 bg-accent-soft text-accent">
                  <TrendingUp className="size-5" />
                </span>
                <h2 className="mt-3.5 text-balance text-[22px] font-semibold leading-snug tracking-[-0.025em] text-ink">
                  This is what {payoff.actionable.length + payoff.confirmed.length + payoff.needsEvidence.length}{" "}
                  task types and {payoff.judged} judged duels look like.
                </h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-3">
                  Bench opens on a worked example, so the routing table is not empty while you learn
                  the shape. It is labelled everywhere, and the first duel you run yourself replaces
                  it with your own record.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: formatCurrency(payoff.actionableSaving, { maximumFractionDigits: 0 }),
                      unit: "/ mo avoidable",
                      detail: `${payoff.actionable.length} routing changes the record supports`,
                      tone: "text-positive",
                    },
                    {
                      value: String(payoff.confirmed.length),
                      unit: "already right",
                      detail: "Where the evidence agrees with the habit",
                      tone: "text-ink",
                    },
                    {
                      value: String(payoff.needsEvidence.length),
                      unit: "not settled",
                      detail: "Where it honestly does not know yet",
                      tone: "text-ink",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.unit}
                      className="rounded-xl border border-line-subtle bg-surface-2/40 p-3.5"
                    >
                      <p
                        className={cn(
                          "font-mono text-[26px] font-semibold leading-8 tabular-nums tracking-[-0.03em]",
                          stat.tone,
                        )}
                      >
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-ink-4">{stat.unit}</p>
                      <p className="mt-1.5 text-[11.5px] leading-snug text-ink-3">{stat.detail}</p>
                    </div>
                  ))}
                </div>

                <ul className="mt-4 space-y-2">
                  {[
                    [
                      "Try judging",
                      `${payoff.open} sample duel${payoff.open === 1 ? " is" : "s are"} open. One click each, names hidden.`,
                    ],
                    ["Read the routing table", "Verdicts, grouped by what you should do about them."],
                    ["Run your own", "The next time a model choice matters, run it as a duel. That starts your record."],
                  ].map(([title, body]) => (
                    <li
                      key={title}
                      className="flex items-start gap-2.5 rounded-lg border border-line-subtle bg-surface-2/40 p-2.5"
                    >
                      <TallyMarks count={1} className="mt-1" />
                      <span>
                        <span className="block text-[12.5px] font-medium text-ink">{title}</span>
                        <span className="block text-[11.5px] leading-snug text-ink-4">{body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line-subtle bg-surface-2/40 px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {step === 0 && !picked && (
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Skip
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                disabled={step === 0 && !picked}
                onClick={() => (step === STEPS.length - 1 ? finish() : setStep((s) => s + 1))}
              >
                {step === STEPS.length - 1 ? "Open my record" : "Continue"}
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
