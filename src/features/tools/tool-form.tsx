"use client";

import { useState } from "react";
import type { BillingCycle, ProviderId, ToolCategory, ToolStatus } from "@/lib/data/types";
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
import { PROVIDER_LIST } from "@/lib/data/seed/providers";
import {
  TOOL_CATEGORIES,
  TOOL_CATEGORY_LABEL,
  TOOL_STATUSES,
  TOOL_STATUS_LABEL,
} from "./tool-meta";

const BILLING: Array<{ value: BillingCycle; label: string }> = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual (shown per month)" },
  { value: "usage", label: "Usage-based" },
  { value: "free", label: "Free" },
];

export function ToolForm({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addTool = useWorkspaceStore((s) => s.addTool);
  const toast = useUiStore((s) => s.toast);

  const [name, setName] = useState("");
  const [provider, setProvider] = useState<ProviderId>("other");
  const [category, setCategory] = useState<ToolCategory>("assistant");
  const [status, setStatus] = useState<ToolStatus>("trial");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setName("");
    setProvider("other");
    setCategory("assistant");
    setStatus("trial");
    setBillingCycle("monthly");
    setMonthlyCost("");
    setUrl("");
    setDescription("");
  };

  const submit = () => {
    if (!name.trim()) return;
    addTool({
      name: name.trim(),
      provider,
      category,
      description: description.trim() || "No description yet.",
      status,
      monthlyCost: billingCycle === "usage" || billingCycle === "free" ? 0 : Number(monthlyCost) || 0,
      billingCycle,
      seats: 1,
      primaryModelId: null,
      url: url.trim() || "#",
      notes: "",
      favorite: false,
      tags: [],
      lastUsedAt: null,
      usage30d: 0,
      renewsOn: null,
    });
    toast({ title: `${name.trim()} added`, description: "Tracking from today", tone: "success" });
    reset();
    onOpenChange(false);
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
          <DialogTitle>Add a tool</DialogTitle>
          <DialogDescription>
            Anything you pay for, or are trialling. It joins the spend and attention views
            immediately.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="tool-name" required>
              <Input
                id="tool-name"
                value={name}
                autoFocus
                placeholder="Perplexity"
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
              />
            </Field>
            <Field label="Provider" htmlFor="tool-provider">
              <Select
                id="tool-provider"
                value={provider}
                onChange={(event) => setProvider(event.target.value as ProviderId)}
              >
                {PROVIDER_LIST.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="other">Other</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="tool-category">
              <Select
                id="tool-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as ToolCategory)}
              >
                {TOOL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {TOOL_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="tool-new-status">
              <Select
                id="tool-new-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as ToolStatus)}
              >
                {TOOL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TOOL_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Billing" htmlFor="tool-billing">
              <Select
                id="tool-billing"
                value={billingCycle}
                onChange={(event) => setBillingCycle(event.target.value as BillingCycle)}
              >
                {BILLING.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Monthly cost"
              hint="USD"
              htmlFor="tool-cost"
              className={billingCycle === "usage" || billingCycle === "free" ? "opacity-50" : ""}
            >
              <Input
                id="tool-cost"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="20"
                disabled={billingCycle === "usage" || billingCycle === "free"}
                value={monthlyCost}
                onChange={(event) => setMonthlyCost(event.target.value)}
              />
            </Field>
          </div>

          <Field label="Website" htmlFor="tool-url">
            <Input
              id="tool-url"
              type="url"
              placeholder="https://"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </Field>

          <Field label="What is it for?" htmlFor="tool-description">
            <Textarea
              id="tool-description"
              rows={3}
              placeholder="One sentence, the way you would describe it to a colleague."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={!name.trim()} onClick={submit}>
            Add tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
