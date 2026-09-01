"use client";

import { useEffect, useMemo, useState } from "react";
import { Braces, Plus, X } from "lucide-react";
import type { Prompt, PromptCategory } from "@/lib/data/types";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { extractVariableNames, syncVariables } from "@/lib/prompts/template";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PROMPT_CATEGORIES, PROMPT_CATEGORY_LABEL } from "./prompt-meta";
import { cn } from "@/lib/utils/cn";

/** Editing surface. Variable definitions reconcile from the body as you type. */
export function PromptEditor({ prompt }: { prompt: Prompt }) {
  const updatePrompt = useWorkspaceStore((s) => s.updatePrompt);
  const models = useWorkspaceStore((s) => s.workspace?.models ?? []);
  const toast = useUiStore((s) => s.toast);

  const [title, setTitle] = useState(prompt.title);
  const [description, setDescription] = useState(prompt.description);
  const [body, setBody] = useState(prompt.body);
  const [category, setCategory] = useState<PromptCategory>(prompt.category);
  const [tags, setTags] = useState<string[]>(prompt.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [modelIds, setModelIds] = useState<string[]>(prompt.modelIds);
  const [note, setNote] = useState("");

  useEffect(() => {
    setTitle(prompt.title);
    setDescription(prompt.description);
    setBody(prompt.body);
    setCategory(prompt.category);
    setTags(prompt.tags);
    setModelIds(prompt.modelIds);
    setNote("");
  }, [prompt.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const detected = useMemo(() => extractVariableNames(body), [body]);
  const nextVariables = useMemo(
    () => syncVariables(body, prompt.variables),
    [body, prompt.variables],
  );
  const added = nextVariables.filter((v) => !prompt.variables.some((p) => p.name === v.name));
  const removed = prompt.variables.filter((v) => !detected.includes(v.name));

  const dirty =
    title !== prompt.title ||
    description !== prompt.description ||
    body !== prompt.body ||
    category !== prompt.category ||
    tags.join() !== prompt.tags.join() ||
    modelIds.join() !== prompt.modelIds.join();

  const addTag = () => {
    const value = tagDraft.trim().toLowerCase().replace(/\s+/g, "-");
    if (!value || tags.includes(value)) {
      setTagDraft("");
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagDraft("");
  };

  const save = () => {
    updatePrompt(
      prompt.id,
      { title: title.trim() || "Untitled prompt", description, body, category, tags, modelIds },
      { note: note.trim() || "Edited" },
    );
    setNote("");
    toast({
      title: "Prompt saved",
      description: body !== prompt.body ? "Previous version kept in history" : undefined,
      tone: "success",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <Field label="Title" htmlFor={`title-${prompt.id}`} required>
          <Input
            id={`title-${prompt.id}`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field label="Category" htmlFor={`cat-${prompt.id}`}>
          <Select
            id={`cat-${prompt.id}`}
            value={category}
            onChange={(event) => setCategory(event.target.value as PromptCategory)}
          >
            {PROMPT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PROMPT_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description" hint="One line, shown in the list" htmlFor={`desc-${prompt.id}`}>
        <Input
          id={`desc-${prompt.id}`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>

      <Field
        label="Body"
        hint="Use {{name}} for anything you fill in each time"
        htmlFor={`body-${prompt.id}`}
      >
        <Textarea
          id={`body-${prompt.id}`}
          value={body}
          rows={16}
          spellCheck={false}
          onChange={(event) => setBody(event.target.value)}
          className="font-mono text-[12px] leading-[1.65]"
        />
      </Field>

      <div className="rounded-lg border border-line-subtle bg-surface-2/40 p-3">
        <div className="flex items-center gap-2">
          <Braces className="size-3.5 text-ink-4" />
          <p className="text-[11.5px] font-medium text-ink-2">
            {detected.length === 0
              ? "No variables detected"
              : `${detected.length} variable${detected.length === 1 ? "" : "s"} detected`}
          </p>
        </div>
        {detected.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {detected.map((name) => (
              <Badge
                key={name}
                tone={added.some((v) => v.name === name) ? "positive" : "outline"}
                className="font-mono"
              >
                {`{{${name}}}`}
                {added.some((v) => v.name === name) && " new"}
              </Badge>
            ))}
          </div>
        )}
        {removed.length > 0 && (
          <p className="mt-2 text-[11px] text-warning">
            {removed.map((v) => `{{${v.name}}}`).join(", ")} no longer appear in the body and will be
            dropped on save.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[11.5px] font-medium text-ink-2">Tags</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface-2 py-0.5 pl-1.5 pr-1 text-[11px] text-ink-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  aria-label={`Remove tag ${tag}`}
                  className="grid size-3.5 place-items-center rounded text-ink-4 transition-colors hover:text-negative"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            <span className="flex items-center gap-1">
              <Input
                value={tagDraft}
                placeholder="Add tag"
                aria-label="Add tag"
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                className="h-6 w-24 px-1.5 text-[11px]"
              />
              <Button variant="ghost" size="icon-sm" onClick={addTag} aria-label="Add tag">
                <Plus className="size-3" />
              </Button>
            </span>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[11.5px] font-medium text-ink-2">Works well with</p>
          <div className="flex flex-wrap gap-1.5">
            {models.slice(0, 8).map((model) => {
              const active = modelIds.includes(model.id);
              return (
                <button
                  key={model.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setModelIds((prev) =>
                      prev.includes(model.id)
                        ? prev.filter((id) => id !== model.id)
                        : [...prev, model.id],
                    )
                  }
                  className={cn(
                    "rounded-sm border px-1.5 py-0.5 text-[11px] transition-colors",
                    active
                      ? "border-accent-line bg-accent-soft text-accent"
                      : "border-line text-ink-3 hover:border-line-strong hover:text-ink-2",
                  )}
                >
                  {model.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-line-subtle pt-3">
        <Input
          value={note}
          placeholder="What changed? (saved with the version)"
          aria-label="Version note"
          onChange={(event) => setNote(event.target.value)}
          className="max-w-xs"
        />
        <Button variant={dirty ? "primary" : "secondary"} size="sm" disabled={!dirty} onClick={save}>
          {dirty ? "Save changes" : "No changes"}
        </Button>
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTitle(prompt.title);
              setDescription(prompt.description);
              setBody(prompt.body);
              setCategory(prompt.category);
              setTags(prompt.tags);
              setModelIds(prompt.modelIds);
            }}
          >
            Discard
          </Button>
        )}
      </div>
    </div>
  );
}
