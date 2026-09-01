"use client";

import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProviderMark } from "@/components/ui/provider-mark";
import { Kbd } from "@/components/ui/kbd";
import { Logo } from "@/components/layout/logo";
import { formatCompact, formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { id: "welcome", label: "Welcome", hint: "What this is" },
  { id: "tools", label: "Your stack", hint: "What you already pay for" },
  { id: "models", label: "Models", hint: "What you reach for" },
  { id: "budget", label: "Budget", hint: "Your monthly ceiling" },
  { id: "ready", label: "Ready", hint: "Where to start" },
] as const;

const BUDGET_PRESETS = [120, 250, 420, 800];

function SelectCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex items-start gap-2.5 rounded-lg border p-2.5 text-left",
        "transition-[border-color,background-color,transform] duration-150 active:translate-y-px",
        selected
          ? "border-accent bg-accent-soft/50"
          : "border-line bg-surface-1 hover:border-line-strong hover:bg-surface-2",
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "absolute right-2 top-2 grid size-4 place-items-center rounded-full border transition-all duration-150",
          selected ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface-2 opacity-0 group-hover:opacity-100",
        )}
      >
        <Check className="size-2.5" strokeWidth={3.5} />
      </span>
    </button>
  );
}

/**
 * First-run flow.
 *
 * Every choice here has a real consequence in the app — the selected tools stay
 * active and everything else is marked as evaluating, chosen models are starred
 * so the Model Lab opens on them, and the budget drives the meter in the
 * sidebar from the first screen.
 */
export function OnboardingFlow() {
  const { workspace } = useWorkspace();
  const completeOnboarding = useWorkspaceStore((s) => s.completeOnboarding);
  const updateTool = useWorkspaceStore((s) => s.updateTool);
  const toast = useUiStore((s) => s.toast);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [toolIds, setToolIds] = useState<string[]>([]);
  const [modelIds, setModelIds] = useState<string[]>([]);
  const [budget, setBudget] = useState(420);

  const tools = useMemo(() => workspace?.tools ?? [], [workspace]);
  const models = useMemo(() => workspace?.models ?? [], [workspace]);

  const suggestedTools = useMemo(
    () => tools.filter((t) => t.status !== "cancelled").slice(0, 12),
    [tools],
  );
  const suggestedModels = useMemo(
    () => [...models].sort((a, b) => (b.personalScore ?? 0) - (a.personalScore ?? 0)).slice(0, 8),
    [models],
  );

  // Seed the form from the workspace once it hydrates.
  useEffect(() => {
    if (!workspace) return;
    setToolIds(workspace.tools.filter((t) => t.status === "active").map((t) => t.id));
    setModelIds(workspace.models.filter((m) => m.favorite).map((m) => m.id));
    setBudget(workspace.preferences.monthlyBudget);
    // Runs once per hydration, not on every workspace mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace !== null]);

  if (!workspace) return null;

  const toggle = (list: string[], id: string, setter: (next: string[]) => void) =>
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const finish = () => {
    // Selections have consequences: unpicked tools drop to "evaluating"
    // rather than silently staying active.
    for (const tool of tools) {
      const picked = toolIds.includes(tool.id);
      if (picked && tool.status !== "active") updateTool(tool.id, { status: "active" });
      if (!picked && tool.status === "active") updateTool(tool.id, { status: "evaluating" });
    }
    completeOnboarding({
      displayName: name.trim(),
      monthlyBudget: budget,
      focusModelIds: modelIds,
    });
    toast({
      title: "Workspace ready",
      description: `${toolIds.length} tools tracked · ${formatCurrency(budget)} monthly budget`,
      tone: "success",
    });
  };

  const canAdvance = step !== 1 || toolIds.length > 0;
  const isLast = step === STEPS.length - 1;

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-canvas/80 backdrop-blur-md" />
        <DialogPrimitive.Content
          aria-label="Set up your workspace"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-[71] flex w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2",
            "max-h-[min(92dvh,44rem)] flex-col overflow-hidden rounded-2xl border border-line",
            "bg-surface-1 shadow-lg data-[state=open]:animate-pop sm:flex-row",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Set up your workspace</DialogPrimitive.Title>

          {/* Rail */}
          <div className="flex shrink-0 items-center gap-4 border-b border-line-subtle bg-surface-2/50 p-4 sm:w-56 sm:flex-col sm:items-stretch sm:border-b-0 sm:border-r sm:p-5">
            <span className="flex items-center gap-2.5 text-accent">
              <Logo size={20} />
              <span className="hidden text-[13px] font-semibold tracking-[-0.01em] text-ink sm:inline">
                Command Center
              </span>
            </span>

            <ol className="flex flex-1 items-center gap-1 sm:mt-7 sm:flex-col sm:items-stretch sm:gap-0">
              {STEPS.map((s, i) => {
                const done = i < step;
                const current = i === step;
                return (
                  <li key={s.id} className="flex flex-1 items-center gap-2.5 sm:flex-none sm:py-1.5">
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[9.5px] font-semibold transition-colors duration-200",
                        done && "border-accent bg-accent text-accent-ink",
                        current && "border-accent text-accent",
                        !done && !current && "border-line text-ink-4",
                      )}
                    >
                      {done ? <Check className="size-2.5" strokeWidth={3.5} /> : i + 1}
                    </span>
                    <span className="hidden min-w-0 sm:block">
                      <span
                        className={cn(
                          "block truncate text-[12.5px] font-medium transition-colors",
                          current ? "text-ink" : done ? "text-ink-2" : "text-ink-4",
                        )}
                      >
                        {s.label}
                      </span>
                      <span className="block truncate text-[10.5px] text-ink-4">{s.hint}</span>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "h-px flex-1 bg-line transition-colors sm:hidden",
                        i === STEPS.length - 1 && "hidden",
                        done && "bg-accent",
                      )}
                    />
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Panel */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
              {step === 0 && (
                <div className="animate-rise">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-line/60 bg-accent-soft px-2 py-0.5 text-[10.5px] font-medium text-accent">
                    <Sparkles className="size-3" />
                    First run
                  </span>
                  <h2 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.025em] text-ink">
                    One cockpit for every AI tool you pay for.
                  </h2>
                  <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-ink-3">
                    Your prompts, models, projects and spend in one place — so you can answer
                    &ldquo;what am I actually paying for, and is it working?&rdquo; in about four
                    seconds.
                  </p>
                  <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Prompt Vault", "Templates with variables, versions and one-key copy"],
                      ["Model Lab", "Compare price, speed and capability side by side"],
                      ["Spending", "Budget, forecast, and where the money went"],
                      ["Command palette", "Everything reachable from ⌘K"],
                    ].map(([title, body]) => (
                      <div key={title} className="rounded-lg border border-line-subtle bg-surface-2/40 p-3">
                        <dt className="text-[12.5px] font-medium text-ink">{title}</dt>
                        <dd className="mt-0.5 text-[11.5px] leading-snug text-ink-4">{body}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 max-w-xs">
                    <label
                      htmlFor="onboarding-name"
                      className="mb-1.5 block text-[11.5px] font-medium text-ink-2"
                    >
                      What should we call you? <span className="text-ink-4">Optional</span>
                    </label>
                    <Input
                      id="onboarding-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Alex"
                      autoComplete="given-name"
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="animate-rise">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                    Which of these are you actually using?
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-3">
                    Anything you leave unchecked is kept but marked as evaluating, so it stops
                    counting toward your active stack.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {suggestedTools.map((tool) => (
                      <SelectCard
                        key={tool.id}
                        selected={toolIds.includes(tool.id)}
                        onClick={() => toggle(toolIds, tool.id, setToolIds)}
                      >
                        <ProviderMark provider={tool.provider} size="sm" />
                        <span className="min-w-0 pr-5">
                          <span className="block truncate text-[12.5px] font-medium text-ink">
                            {tool.name}
                          </span>
                          <span className="block truncate text-[11px] text-ink-4">
                            {tool.billingCycle === "usage"
                              ? "Usage-based"
                              : tool.monthlyCost > 0
                                ? `${formatCurrency(tool.monthlyCost)}/mo`
                                : tool.status === "paused"
                                  ? "Paused — no charge"
                                  : "Free"}
                          </span>
                        </span>
                      </SelectCard>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-rise">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                    Which models do you reach for first?
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-3">
                    These get starred, so the Model Lab and comparison views open on them.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {suggestedModels.map((model) => (
                      <SelectCard
                        key={model.id}
                        selected={modelIds.includes(model.id)}
                        onClick={() => toggle(modelIds, model.id, setModelIds)}
                      >
                        <ProviderMark provider={model.provider} size="sm" />
                        <span className="min-w-0 pr-5">
                          <span className="block truncate text-[12.5px] font-medium text-ink">
                            {model.name}
                          </span>
                          <span className="block truncate font-mono text-[10.5px] tabular-nums text-ink-4">
                            ${model.inputPrice}/${model.outputPrice} per M ·{" "}
                            {formatCompact(model.contextWindow)}
                          </span>
                        </span>
                      </SelectCard>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-rise">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                    What is your monthly ceiling?
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-3">
                    Used for the budget meter and the month-end forecast. You can change it any
                    time in Settings.
                  </p>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tracking-[-0.03em] text-ink-3">$</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={budget}
                      onChange={(event) => setBudget(Math.max(0, Number(event.target.value) || 0))}
                      aria-label="Monthly budget in dollars"
                      className="w-40 border-0 border-b-2 border-line bg-transparent pb-1 text-4xl font-semibold tabular-nums tracking-[-0.03em] text-ink outline-none transition-colors focus:border-accent"
                    />
                    <span className="text-sm text-ink-4">/ month</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {BUDGET_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBudget(preset)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 font-mono text-[12px] tabular-nums transition-colors",
                          budget === preset
                            ? "border-accent bg-accent-soft text-accent"
                            : "border-line text-ink-3 hover:border-line-strong hover:text-ink",
                        )}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>

                  <p className="mt-5 rounded-lg border border-line-subtle bg-surface-2/40 p-3 text-[11.5px] leading-relaxed text-ink-3">
                    For reference, the {toolIds.length} tools you selected carry{" "}
                    <span className="font-mono font-medium text-ink">
                      {formatCurrency(
                        tools
                          .filter((t) => toolIds.includes(t.id))
                          .reduce((sum, t) => sum + t.monthlyCost, 0),
                      )}
                    </span>{" "}
                    of fixed subscription cost before any API usage.
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="animate-rise">
                  <span className="grid size-10 place-items-center rounded-xl border border-accent-line/60 bg-accent-soft text-accent">
                    <Check className="size-5" strokeWidth={2.5} />
                  </span>
                  <h2 className="mt-3.5 text-lg font-semibold tracking-[-0.02em] text-ink">
                    {name.trim() ? `You're set, ${name.trim()}.` : "You're set."}
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-3">
                    The workspace is loaded with a realistic year of history so nothing is empty.
                    Three places worth opening first:
                  </p>
                  <ul className="mt-4 space-y-2">
                    {[
                      ["Press ⌘K", "Search every prompt, tool, model and project from one field."],
                      ["Prompt Vault", "Fill in a prompt's variables and copy the result."],
                      ["Spending", "See the month-end forecast against your new budget."],
                    ].map(([title, body]) => (
                      <li
                        key={title}
                        className="flex gap-3 rounded-lg border border-line-subtle bg-surface-2/40 p-3"
                      >
                        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent" />
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

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line-subtle bg-surface-2/40 px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ArrowLeft className="size-3.5" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                {step === 1 && (
                  <span className="hidden font-mono text-[11px] tabular-nums text-ink-4 sm:inline">
                    {toolIds.length} selected
                  </span>
                )}
                {step === 2 && (
                  <span className="hidden font-mono text-[11px] tabular-nums text-ink-4 sm:inline">
                    {modelIds.length} starred
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canAdvance}
                  onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
                >
                  {isLast ? "Open the dashboard" : "Continue"}
                  {isLast ? <Kbd className="ml-0.5 border-accent-ink/25 bg-accent-ink/10 text-accent-ink">↵</Kbd> : <ArrowRight className="size-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
