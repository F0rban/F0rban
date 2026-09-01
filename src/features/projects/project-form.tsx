"use client";

import { useState } from "react";
import type { ProjectStatus } from "@/lib/data/types";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL } from "./project-meta";
import { cn } from "@/lib/utils/cn";

const SERIES = [1, 2, 3, 4, 5, 6, 7, 8];

export function ProjectForm({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const createProject = useWorkspaceStore((s) => s.createProject);
  const toast = useUiStore((s) => s.toast);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [budget, setBudget] = useState("");
  const [series, setSeries] = useState(3);

  const reset = () => {
    setName("");
    setCode("");
    setDescription("");
    setStatus("planning");
    setBudget("");
    setSeries(3);
  };

  const submit = () => {
    if (!name.trim()) return;
    const id = createProject({
      name: name.trim(),
      code: (code.trim() || name.trim().slice(0, 3)).toUpperCase().slice(0, 4),
      description: description.trim(),
      status,
      budget: budget ? Number(budget) : null,
      series,
    });
    toast({ title: `${name.trim()} created`, tone: "success" });
    reset();
    onOpenChange(false);
    onCreated?.(id);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            A project groups the prompts, tools and models used for one piece of work — and gives
            its spend somewhere to land.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
            <Field label="Name" htmlFor="project-name" required>
              <Input
                id="project-name"
                autoFocus
                value={name}
                placeholder="Atlas — knowledge base search"
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && submit()}
              />
            </Field>
            <Field label="Code" hint="3–4 chars" htmlFor="project-code">
              <Input
                id="project-code"
                value={code}
                maxLength={4}
                placeholder={name.slice(0, 3).toUpperCase() || "ATL"}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="project-description">
            <Textarea
              id="project-description"
              rows={3}
              value={description}
              placeholder="What is this project trying to achieve, and for whom?"
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="project-status">
              <Select
                id="project-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Monthly budget" hint="USD, optional" htmlFor="project-budget">
              <Input
                id="project-budget"
                type="number"
                min={0}
                step="10"
                inputMode="decimal"
                value={budget}
                placeholder="120"
                onChange={(event) => setBudget(event.target.value)}
              />
            </Field>
          </div>

          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-ink-2">Colour</p>
            <div className="flex gap-1.5">
              {SERIES.map((index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSeries(index)}
                  aria-label={`Colour ${index}`}
                  aria-pressed={series === index}
                  className={cn(
                    "size-6 rounded-md border-2 transition-transform",
                    series === index ? "scale-110 border-ink-3" : "border-transparent",
                  )}
                  style={{ backgroundColor: `var(--series-${index})` }}
                />
              ))}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={!name.trim()} onClick={submit}>
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
