"use client";

import { create } from "zustand";
import type {
  ActivityEvent,
  ActivityKind,
  Model,
  Preferences,
  Project,
  ProjectTask,
  Prompt,
  Tool,
  Workflow,
  Workspace,
} from "../data/types";
import { LocalStorageAdapter } from "../data/local-adapter";
import type { WorkspaceAdapter } from "../data/adapter";
import { createSeedWorkspace } from "../data/seed";
import { createId } from "../utils/id";
import { syncVariables } from "../prompts/template";

/**
 * The one stateful thing in the app.
 *
 * Components never touch the adapter; they call actions here. Every mutation
 * writes an activity event and schedules a debounced persist, which is what
 * makes the timeline on the dashboard reflect real user actions rather than
 * being a decorative list.
 */

export type Status = "idle" | "loading" | "ready";

interface WorkspaceState {
  status: Status;
  workspace: Workspace | null;
  adapter: WorkspaceAdapter;

  hydrate: () => Promise<void>;
  setAdapter: (adapter: WorkspaceAdapter) => void;
  reset: () => Promise<void>;
  replaceWorkspace: (workspace: Workspace) => void;

  // Preferences
  updatePreferences: (patch: Partial<Preferences>) => void;
  completeOnboarding: (patch: Partial<Preferences>) => void;

  // Tools
  toggleToolFavorite: (id: string) => void;
  updateTool: (id: string, patch: Partial<Tool>) => void;
  addTool: (tool: Omit<Tool, "id" | "addedAt">) => string;
  deleteTool: (id: string) => void;

  // Models
  toggleModelFavorite: (id: string) => void;
  scoreModel: (id: string, score: number | null) => void;
  updateModel: (id: string, patch: Partial<Model>) => void;

  // Prompts
  createPrompt: (draft: Partial<Prompt>) => string;
  updatePrompt: (id: string, patch: Partial<Prompt>, options?: { recordVersion?: boolean; note?: string }) => void;
  duplicatePrompt: (id: string) => string | null;
  deletePrompt: (id: string) => void;
  togglePromptFavorite: (id: string) => void;
  recordPromptRun: (id: string) => void;
  restorePromptVersion: (promptId: string, versionId: string) => void;

  // Projects
  createProject: (draft: Partial<Project>) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleTask: (projectId: string, taskId: string) => void;
  addTask: (projectId: string, title: string) => void;
  removeTask: (projectId: string, taskId: string) => void;

  // Workflows
  updateWorkflow: (id: string, patch: Partial<Workflow>) => void;
  recordWorkflowRun: (id: string, cost: number) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(adapter: WorkspaceAdapter, workspace: Workspace) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void adapter.save(workspace);
  }, 260);
}

function logEvent(
  workspace: Workspace,
  kind: ActivityKind,
  title: string,
  detail: string,
  entityType: ActivityEvent["entityType"],
  entityId: string | null,
): ActivityEvent[] {
  const event: ActivityEvent = {
    id: createId("a"),
    at: new Date().toISOString(),
    kind,
    title,
    detail,
    entityType,
    entityId,
    cost: null,
  };
  return [event, ...workspace.activity].slice(0, 240);
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => {
  /** Applies a pure transform, logs it, and persists. The only write path. */
  function mutate(
    transform: (ws: Workspace) => Workspace,
    log?: {
      kind: ActivityKind;
      title: string;
      detail: string;
      entityType: ActivityEvent["entityType"];
      entityId: string | null;
    },
  ) {
    const current = get().workspace;
    if (!current) return;
    let next = transform(current);
    if (log) {
      next = {
        ...next,
        activity: logEvent(next, log.kind, log.title, log.detail, log.entityType, log.entityId),
      };
    }
    set({ workspace: next });
    schedulePersist(get().adapter, next);
  }

  return {
    status: "idle",
    workspace: null,
    adapter: new LocalStorageAdapter(),

    setAdapter: (adapter) => set({ adapter }),

    hydrate: async () => {
      if (get().status !== "idle") return;
      set({ status: "loading" });
      const adapter = get().adapter;
      const stored = await adapter.load();
      const workspace = stored ?? createSeedWorkspace(new Date());
      if (!stored) await adapter.save(workspace);
      set({ workspace, status: "ready" });
    },

    reset: async () => {
      const adapter = get().adapter;
      await adapter.clear();
      const workspace = createSeedWorkspace(new Date());
      await adapter.save(workspace);
      set({ workspace, status: "ready" });
    },

    replaceWorkspace: (workspace) => {
      set({ workspace, status: "ready" });
      schedulePersist(get().adapter, workspace);
    },

    /* ---------------------------------------------------------- */

    updatePreferences: (patch) =>
      mutate((ws) => ({ ...ws, preferences: { ...ws.preferences, ...patch } })),

    completeOnboarding: (patch) =>
      mutate(
        (ws) => ({
          ...ws,
          preferences: { ...ws.preferences, ...patch, onboardingComplete: true },
          models: patch.focusModelIds?.length
            ? ws.models.map((m) =>
                patch.focusModelIds!.includes(m.id) ? { ...m, favorite: true } : m,
              )
            : ws.models,
        }),
        {
          kind: "project.updated",
          title: "Workspace configured",
          detail: "Onboarding complete — budget, tools and preferred models set",
          entityType: null,
          entityId: null,
        },
      ),

    /* ---------------------------------------------------------- */

    toggleToolFavorite: (id) =>
      mutate((ws) => ({
        ...ws,
        tools: ws.tools.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t)),
      })),

    updateTool: (id, patch) => {
      const tool = get().workspace?.tools.find((t) => t.id === id);
      mutate(
        (ws) => ({
          ...ws,
          tools: ws.tools.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }),
        patch.status && tool && patch.status !== tool.status
          ? {
              kind: "tool.status",
              title: `${tool.name} → ${patch.status}`,
              detail: `Status changed from ${tool.status} to ${patch.status}`,
              entityType: "tool",
              entityId: id,
            }
          : undefined,
      );
    },

    addTool: (tool) => {
      const id = createId("t");
      mutate(
        (ws) => ({
          ...ws,
          tools: [{ ...tool, id, addedAt: new Date().toISOString() }, ...ws.tools],
        }),
        {
          kind: "tool.added",
          title: `Added ${tool.name}`,
          detail: `${tool.category} · ${tool.status}`,
          entityType: "tool",
          entityId: id,
        },
      );
      return id;
    },

    deleteTool: (id) =>
      mutate((ws) => ({ ...ws, tools: ws.tools.filter((t) => t.id !== id) })),

    /* ---------------------------------------------------------- */

    toggleModelFavorite: (id) =>
      mutate((ws) => ({
        ...ws,
        models: ws.models.map((m) => (m.id === id ? { ...m, favorite: !m.favorite } : m)),
      })),

    scoreModel: (id, score) => {
      const model = get().workspace?.models.find((m) => m.id === id);
      mutate(
        (ws) => ({
          ...ws,
          models: ws.models.map((m) => (m.id === id ? { ...m, personalScore: score } : m)),
        }),
        model && score !== null
          ? {
              kind: "model.scored",
              title: `Scored ${model.name}`,
              detail: `Personal score set to ${score.toFixed(1)}`,
              entityType: "model",
              entityId: id,
            }
          : undefined,
      );
    },

    updateModel: (id, patch) =>
      mutate((ws) => ({
        ...ws,
        models: ws.models.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      })),

    /* ---------------------------------------------------------- */

    createPrompt: (draft) => {
      const id = createId("p");
      const now = new Date().toISOString();
      const body = draft.body ?? "";
      const prompt: Prompt = {
        id,
        title: draft.title?.trim() || "Untitled prompt",
        description: draft.description ?? "",
        body,
        category: draft.category ?? "writing",
        tags: draft.tags ?? [],
        variables: syncVariables(body, draft.variables ?? []),
        favorite: draft.favorite ?? false,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: null,
        useCount: 0,
        modelIds: draft.modelIds ?? [],
        versions: [],
      };
      mutate((ws) => ({ ...ws, prompts: [prompt, ...ws.prompts] }), {
        kind: "prompt.created",
        title: `Created ${prompt.title}`,
        detail: prompt.variables.length
          ? `${prompt.variables.length} variable${prompt.variables.length === 1 ? "" : "s"} · ${prompt.category}`
          : prompt.category,
        entityType: "prompt",
        entityId: id,
      });
      return id;
    },

    updatePrompt: (id, patch, options) => {
      const existing = get().workspace?.prompts.find((p) => p.id === id);
      if (!existing) return;
      const bodyChanged = patch.body !== undefined && patch.body !== existing.body;
      mutate(
        (ws) => ({
          ...ws,
          prompts: ws.prompts.map((p) => {
            if (p.id !== id) return p;
            const nextBody = patch.body ?? p.body;
            return {
              ...p,
              ...patch,
              body: nextBody,
              variables: patch.variables ?? syncVariables(nextBody, p.variables),
              updatedAt: new Date().toISOString(),
              versions:
                bodyChanged && options?.recordVersion !== false
                  ? [
                      ...p.versions,
                      {
                        id: createId("v"),
                        body: existing.body,
                        createdAt: new Date().toISOString(),
                        note: options?.note ?? "Edited",
                      },
                    ].slice(-12)
                  : p.versions,
            };
          }),
        }),
        bodyChanged
          ? {
              kind: "prompt.updated",
              title: `Updated ${patch.title ?? existing.title}`,
              detail: options?.note ?? "Prompt body edited",
              entityType: "prompt",
              entityId: id,
            }
          : undefined,
      );
    },

    duplicatePrompt: (id) => {
      const source = get().workspace?.prompts.find((p) => p.id === id);
      if (!source) return null;
      const newId = createId("p");
      const now = new Date().toISOString();
      mutate(
        (ws) => {
          const index = ws.prompts.findIndex((p) => p.id === id);
          const copy: Prompt = {
            ...structuredClone(source),
            id: newId,
            title: `${source.title} (copy)`,
            createdAt: now,
            updatedAt: now,
            lastUsedAt: null,
            useCount: 0,
            favorite: false,
            versions: [],
          };
          const next = [...ws.prompts];
          next.splice(index + 1, 0, copy);
          return { ...ws, prompts: next };
        },
        {
          kind: "prompt.created",
          title: `Duplicated ${source.title}`,
          detail: "Copy created — history not carried over",
          entityType: "prompt",
          entityId: newId,
        },
      );
      return newId;
    },

    deletePrompt: (id) =>
      mutate((ws) => ({
        ...ws,
        prompts: ws.prompts.filter((p) => p.id !== id),
        projects: ws.projects.map((project) =>
          project.promptIds.includes(id)
            ? { ...project, promptIds: project.promptIds.filter((pid) => pid !== id) }
            : project,
        ),
      })),

    togglePromptFavorite: (id) =>
      mutate((ws) => ({
        ...ws,
        prompts: ws.prompts.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)),
      })),

    recordPromptRun: (id) => {
      const prompt = get().workspace?.prompts.find((p) => p.id === id);
      if (!prompt) return;
      mutate(
        (ws) => ({
          ...ws,
          prompts: ws.prompts.map((p) =>
            p.id === id
              ? { ...p, useCount: p.useCount + 1, lastUsedAt: new Date().toISOString() }
              : p,
          ),
        }),
        {
          kind: "prompt.run",
          title: `Copied ${prompt.title}`,
          detail: `${prompt.variables.length} variable${prompt.variables.length === 1 ? "" : "s"} filled · ready to paste`,
          entityType: "prompt",
          entityId: id,
        },
      );
    },

    restorePromptVersion: (promptId, versionId) => {
      const prompt = get().workspace?.prompts.find((p) => p.id === promptId);
      const version = prompt?.versions.find((v) => v.id === versionId);
      if (!prompt || !version) return;
      mutate(
        (ws) => ({
          ...ws,
          prompts: ws.prompts.map((p) =>
            p.id === promptId
              ? {
                  ...p,
                  body: version.body,
                  variables: syncVariables(version.body, p.variables),
                  updatedAt: new Date().toISOString(),
                  versions: [
                    ...p.versions,
                    {
                      id: createId("v"),
                      body: p.body,
                      createdAt: new Date().toISOString(),
                      note: "Replaced by a restore",
                    },
                  ].slice(-12),
                }
              : p,
          ),
        }),
        {
          kind: "prompt.updated",
          title: `Restored ${prompt.title}`,
          detail: version.note,
          entityType: "prompt",
          entityId: promptId,
        },
      );
    },

    /* ---------------------------------------------------------- */

    createProject: (draft) => {
      const id = createId("pr");
      const now = new Date().toISOString();
      const name = draft.name?.trim() || "Untitled project";
      const project: Project = {
        id,
        name,
        code: draft.code || name.slice(0, 3).toUpperCase(),
        description: draft.description ?? "",
        status: draft.status ?? "planning",
        objectives: draft.objectives ?? [],
        tasks: draft.tasks ?? [],
        promptIds: draft.promptIds ?? [],
        toolIds: draft.toolIds ?? [],
        modelIds: draft.modelIds ?? [],
        notes: draft.notes ?? "",
        budget: draft.budget ?? null,
        createdAt: now,
        updatedAt: now,
        dueDate: draft.dueDate ?? null,
        series: draft.series ?? 3,
        tags: draft.tags ?? [],
      };
      mutate((ws) => ({ ...ws, projects: [project, ...ws.projects] }), {
        kind: "project.created",
        title: `Created ${project.name}`,
        detail: project.status,
        entityType: "project",
        entityId: id,
      });
      return id;
    },

    updateProject: (id, patch) =>
      mutate((ws) => ({
        ...ws,
        projects: ws.projects.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
        ),
      })),

    deleteProject: (id) =>
      mutate((ws) => ({
        ...ws,
        projects: ws.projects.filter((p) => p.id !== id),
        workflows: ws.workflows.map((w) => (w.projectId === id ? { ...w, projectId: null } : w)),
      })),

    toggleTask: (projectId, taskId) => {
      const project = get().workspace?.projects.find((p) => p.id === projectId);
      const task = project?.tasks.find((t) => t.id === taskId);
      mutate(
        (ws) => ({
          ...ws,
          projects: ws.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  updatedAt: new Date().toISOString(),
                  tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
                }
              : p,
          ),
        }),
        project && task && !task.done
          ? {
              kind: "project.updated",
              title: project.name,
              detail: `Closed: ${task.title}`,
              entityType: "project",
              entityId: projectId,
            }
          : undefined,
      );
    },

    addTask: (projectId, title) => {
      const task: ProjectTask = { id: createId("tk"), title, done: false, dueDate: null };
      mutate((ws) => ({
        ...ws,
        projects: ws.projects.map((p) =>
          p.id === projectId
            ? { ...p, tasks: [...p.tasks, task], updatedAt: new Date().toISOString() }
            : p,
        ),
      }));
    },

    removeTask: (projectId, taskId) =>
      mutate((ws) => ({
        ...ws,
        projects: ws.projects.map((p) =>
          p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p,
        ),
      })),

    /* ---------------------------------------------------------- */

    updateWorkflow: (id, patch) =>
      mutate((ws) => ({
        ...ws,
        workflows: ws.workflows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      })),

    recordWorkflowRun: (id, cost) => {
      const workflow = get().workspace?.workflows.find((w) => w.id === id);
      if (!workflow) return;
      mutate(
        (ws) => ({
          ...ws,
          workflows: ws.workflows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  runCount: w.runCount + 1,
                  lastRunAt: new Date().toISOString(),
                  lastRunCost: cost,
                }
              : w,
          ),
        }),
        {
          kind: "workflow.run",
          title: `${workflow.name} simulated`,
          detail: `${workflow.nodes.length} steps · estimated $${cost.toFixed(4)}`,
          entityType: "workflow",
          entityId: id,
        },
      );
    },
  };
});
