"use client";

import { useRef, useState } from "react";
import { Database, Download, RotateCcw, Upload } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { SwitchField } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { WORKSPACE_VERSION } from "@/lib/data/seed";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import type { Workspace } from "@/lib/data/types";

export default function SettingsPage() {
  const { workspace, ready } = useWorkspace();
  const updatePreferences = useWorkspaceStore((s) => s.updatePreferences);
  const replaceWorkspace = useWorkspaceStore((s) => s.replaceWorkspace);
  const reset = useWorkspaceStore((s) => s.reset);
  const toast = useUiStore((s) => s.toast);

  const fileInput = useRef<HTMLInputElement>(null);
  const [budgetDraft, setBudgetDraft] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  if (!ready || !workspace) {
    return (
      <PageContainer width="narrow">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  const prefs = workspace.preferences;
  const budget = budgetDraft ?? String(prefs.monthlyBudget);
  const name = nameDraft ?? prefs.displayName;

  const stats = {
    tools: workspace.tools.length,
    models: workspace.models.length,
    prompts: workspace.prompts.length,
    projects: workspace.projects.length,
    workflows: workspace.workflows.length,
    spend: workspace.spend.length,
    activity: workspace.activity.length,
    bytes: new Blob([JSON.stringify(workspace)]).size,
  };

  const exportWorkspace = () => {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `command-center-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast({ title: "Workspace exported", tone: "success" });
  };

  const importWorkspace = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Workspace;
      if (
        typeof parsed !== "object" ||
        !Array.isArray(parsed.tools) ||
        !Array.isArray(parsed.prompts) ||
        !parsed.preferences
      ) {
        throw new Error("shape");
      }
      replaceWorkspace(parsed);
      toast({
        title: "Workspace imported",
        description: `${parsed.tools.length} tools, ${parsed.prompts.length} prompts`,
        tone: "success",
      });
    } catch {
      toast({
        title: "Could not import that file",
        description: "It does not look like a Command Center export.",
        tone: "danger",
      });
    }
  };

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Settings"
        description="Everything here is stored in this browser. Nothing leaves the device."
      />

      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Used for the greeting on the dashboard.</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="max-w-sm">
            <Field label="Display name" htmlFor="settings-name">
              <div className="flex gap-2">
                <Input
                  id="settings-name"
                  value={name}
                  placeholder="Alex"
                  onChange={(event) => setNameDraft(event.target.value)}
                />
                <Button
                  variant={nameDraft !== null && nameDraft !== prefs.displayName ? "primary" : "secondary"}
                  size="md"
                  disabled={nameDraft === null || nameDraft === prefs.displayName}
                  onClick={() => {
                    updatePreferences({ displayName: name.trim() });
                    setNameDraft(null);
                    toast({ title: "Name saved", tone: "success" });
                  }}
                >
                  Save
                </Button>
              </div>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Budget</CardTitle>
              <CardDescription>
                Drives the sidebar meter, the month-end forecast and the budget alerts.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="max-w-sm">
            <Field label="Monthly ceiling" hint="USD" htmlFor="settings-budget">
              <div className="flex gap-2">
                <Input
                  id="settings-budget"
                  type="number"
                  min={0}
                  step={10}
                  inputMode="decimal"
                  value={budget}
                  onChange={(event) => setBudgetDraft(event.target.value)}
                />
                <Button
                  variant={
                    budgetDraft !== null && Number(budgetDraft) !== prefs.monthlyBudget
                      ? "primary"
                      : "secondary"
                  }
                  size="md"
                  disabled={budgetDraft === null || Number(budgetDraft) === prefs.monthlyBudget}
                  onClick={() => {
                    updatePreferences({ monthlyBudget: Math.max(0, Number(budget) || 0) });
                    setBudgetDraft(null);
                    toast({ title: "Budget updated", tone: "success" });
                  }}
                >
                  Save
                </Button>
              </div>
            </Field>
            <p className="mt-2 text-[11.5px] text-ink-4">
              Currently {formatCurrency(prefs.monthlyBudget)} per month, or{" "}
              {formatCurrency(prefs.monthlyBudget * 12)} a year.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Light and dark are separate designs, not an inversion.</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="space-y-1">
            <div className="flex items-center justify-between gap-6 py-1">
              <span>
                <span className="block text-[13px] font-medium text-ink">Theme</span>
                <span className="mt-0.5 block text-xs text-ink-3">
                  System follows your operating system setting.
                </span>
              </span>
              <ThemeToggle />
            </div>
            <div className="h-px bg-line-subtle" />
            <SwitchField
              label="Compact density"
              description="Tighter rows in tables and lists."
              checked={prefs.compactDensity}
              onCheckedChange={(checked) => updatePreferences({ compactDensity: checked })}
            />
            <div className="h-px bg-line-subtle" />
            <SwitchField
              label="Reduce motion"
              description="Turns off entrance animations and the workflow run animation. Your OS setting is respected either way."
              checked={prefs.reduceMotion}
              onCheckedChange={(checked) => updatePreferences({ reduceMotion: checked })}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Data</CardTitle>
              <CardDescription>
                This workspace lives in localStorage. Export it to move it, or to keep a backup.
              </CardDescription>
            </div>
            <Badge tone="outline">v{WORKSPACE_VERSION}</Badge>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
              {[
                ["Tools", stats.tools],
                ["Models", stats.models],
                ["Prompts", stats.prompts],
                ["Projects", stats.projects],
                ["Workflows", stats.workflows],
                ["Spend rows", stats.spend],
                ["Activity", stats.activity],
                ["Size", `${Math.round(stats.bytes / 1024)} KB`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-2">
                  <dt className="text-[11.5px] text-ink-4">{label}</dt>
                  <dd className="font-mono text-[12px] tabular-nums text-ink-2">
                    {typeof value === "number" ? formatNumber(value) : value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={exportWorkspace}>
                <Download className="size-3.5" />
                Export JSON
              </Button>
              <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
                <Upload className="size-3.5" />
                Import JSON
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                aria-hidden
                tabIndex={-1}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importWorkspace(file);
                  event.target.value = "";
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-negative hover:bg-negative-soft"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw className="size-3.5" />
                Reset to sample data
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>About this prototype</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-2.5 text-[12.5px] leading-relaxed text-ink-3">
            <p>
              AI Command Center is a working prototype. Everything you see runs locally: there is
              no account, no server, and no provider API is called. Model prices, capability scores
              and spend history are illustrative seed data, generated from a fixed seed so the same
              day always produces the same workspace.
            </p>
            <p className="flex items-start gap-2">
              <Database className="mt-0.5 size-3.5 shrink-0 text-ink-4" />
              <span>
                The storage layer is a single <code className="font-mono text-ink-2">WorkspaceAdapter</code>{" "}
                interface. Swapping the localStorage implementation for Supabase or Postgres is the
                whole migration — no component changes.
              </span>
            </p>
          </CardBody>
        </Card>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Reset this workspace?</DialogTitle>
            <DialogDescription>
              Every prompt, project, note and score you have changed will be replaced with the
              original sample data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-[12.5px] text-ink-3">
              Export a copy first if you want to keep this state.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                void reset().then(() => {
                  setResetOpen(false);
                  toast({ title: "Workspace reset", tone: "warning" });
                });
              }}
            >
              Reset workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
