"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Eraser, Play, RotateCcw } from "lucide-react";
import type { Prompt } from "@/lib/data/types";
import { defaultValues, estimateTokens, renderSegments, renderTemplate } from "@/lib/prompts/template";
import { useCopy } from "@/hooks/use-copy";
import { useUiStore } from "@/lib/store/ui";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * Fill-in panel: the reason a prompt library is worth having.
 *
 * Values persist per prompt for the session, the preview marks which text came
 * from a variable and which placeholder is still empty, and copying records a
 * real run so the vault's usage counts mean something.
 */
export function PromptComposer({ prompt }: { prompt: Prompt }) {
  const [values, setValues] = useState<Record<string, string>>(() => defaultValues(prompt));
  const { copied, copy } = useCopy();
  const toast = useUiStore((s) => s.toast);
  const recordRun = useWorkspaceStore((s) => s.recordPromptRun);

  useEffect(() => {
    setValues(defaultValues(prompt));
  }, [prompt.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => renderTemplate(prompt.body, values), [prompt.body, values]);
  const segments = useMemo(() => renderSegments(prompt.body, values), [prompt.body, values]);
  const tokens = estimateTokens(result.text);

  const onCopy = async () => {
    const ok = await copy(result.text);
    if (!ok) {
      toast({ title: "Could not copy", description: "Clipboard access was blocked", tone: "danger" });
      return;
    }
    recordRun(prompt.id);
    toast({
      title: "Prompt copied",
      description: result.missing.length
        ? `${result.missing.length} variable${result.missing.length === 1 ? "" : "s"} left unfilled`
        : `${formatNumber(tokens)} tokens, ready to paste`,
      tone: result.missing.length ? "warning" : "success",
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-4">
            Variables
          </h3>
          {prompt.variables.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setValues(defaultValues(prompt))}
                title="Reset to defaults"
              >
                <RotateCcw className="size-3" />
                Reset
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setValues({})}
                title="Clear every field"
              >
                <Eraser className="size-3" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {prompt.variables.length === 0 ? (
          <EmptyState
            compact
            title="No variables"
            description="This prompt is used as-is. Add {{placeholders}} in the editor to make it reusable."
          />
        ) : (
          <div className="space-y-3">
            {prompt.variables.map((variable) => {
              const id = `var-${prompt.id}-${variable.name}`;
              const filled = Boolean(values[variable.name]?.trim());
              return (
                <div key={variable.name}>
                  {/* The token sits beside the label, not inside it, so the
                      field's accessible name is just the human label. */}
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <label
                      htmlFor={id}
                      className="truncate text-[11.5px] font-medium text-ink-2"
                    >
                      {variable.label}
                    </label>
                    <span
                      aria-hidden
                      className={cn(
                        "shrink-0 font-mono text-[10px]",
                        filled ? "text-positive" : "text-ink-4",
                      )}
                    >
                      {`{{${variable.name}}}`}
                    </span>
                  </div>

                  {variable.type === "select" ? (
                    <Select
                      id={id}
                      value={values[variable.name] ?? ""}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [variable.name]: event.target.value }))
                      }
                    >
                      <option value="">Not set</option>
                      {variable.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  ) : variable.type === "longtext" ? (
                    <Textarea
                      id={id}
                      rows={4}
                      placeholder={variable.description || "Paste content here"}
                      value={values[variable.name] ?? ""}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [variable.name]: event.target.value }))
                      }
                    />
                  ) : (
                    <Input
                      id={id}
                      type={variable.type === "number" ? "number" : "text"}
                      placeholder={variable.description || variable.label}
                      value={values[variable.name] ?? ""}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [variable.name]: event.target.value }))
                      }
                    />
                  )}

                  {variable.description && variable.type !== "longtext" && (
                    <p className="mt-1 text-[10.5px] leading-snug text-ink-4">
                      {variable.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-4">
            Preview
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] tabular-nums text-ink-4">
              ~{formatNumber(tokens)} tokens
            </span>
            {result.total > 0 && (
              <span
                className={cn(
                  "font-mono text-[10.5px] tabular-nums",
                  result.missing.length ? "text-warning" : "text-positive",
                )}
              >
                {result.filled}/{result.total} filled
              </span>
            )}
          </div>
        </div>

        <div className="relative min-h-64 flex-1 overflow-auto rounded-lg border border-line bg-surface-2/40 p-3">
          <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[1.65] text-ink-2">
            {segments.map((segment, index) =>
              segment.kind === "text" ? (
                <span key={index}>{segment.text}</span>
              ) : segment.kind === "filled" ? (
                <mark
                  key={index}
                  title={`From {{${segment.name}}}`}
                  className="rounded-[3px] bg-positive-soft px-0.5 text-positive"
                >
                  {segment.text}
                </mark>
              ) : (
                <mark
                  key={index}
                  title={`{{${segment.name}}} is not filled in`}
                  className="rounded-[3px] bg-warning-soft px-0.5 text-warning"
                >
                  {segment.text}
                </mark>
              ),
            )}
          </pre>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={onCopy}>
            {copied ? <Check className="size-3.5" strokeWidth={3} /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy prompt"}
          </Button>
          {result.missing.length > 0 && (
            <span className="text-[11.5px] text-warning">
              {result.missing.map((name) => `{{${name}}}`).join(", ")} still empty
            </span>
          )}
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-ink-4">
            <Play className="size-3" />
            Used {formatNumber(prompt.useCount)}×
          </span>
        </div>
      </div>
    </div>
  );
}
