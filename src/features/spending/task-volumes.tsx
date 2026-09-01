"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { TASK_LABEL, TASK_TYPES } from "@/lib/data/seed/duels";
import { priceRun } from "@/lib/providers/pricing";
import { formatCurrency } from "@/lib/utils/format";

/**
 * Volumes and current defaults.
 *
 * Everything on the Verdicts page is priced from these numbers, so they cannot
 * live only in seed data — the headline saving is exactly as good as what is
 * typed here, and the page says so.
 */
export function TaskVolumes() {
  const { workspace, ready } = useWorkspace();
  const updateTaskProfile = useWorkspaceStore((s) => s.updateTaskProfile);

  const models = workspace?.models ?? [];
  const byType = useMemo(
    () => new Map((workspace?.taskProfiles ?? []).map((p) => [p.taskType, p])),
    [workspace],
  );

  if (!ready || !workspace) return null;

  const total = [...byType.values()].reduce((sum, profile) => {
    const model = models.find((m) => m.id === profile.currentModelId);
    if (!model) return sum;
    return sum + priceRun(model, profile.avgTokensIn, profile.avgTokensOut) * profile.runsPerMonth;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>How much of each kind of work you run</CardTitle>
          <CardDescription>
            Every figure on the Verdicts page is priced from these. A verdict is
            worth nothing until it knows you run 12,000 classifications a month.
          </CardDescription>
        </div>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-[15px] font-semibold tabular-nums text-ink">
            {formatCurrency(total, { maximumFractionDigits: 0 })}
          </span>
          <span className="block text-[10px] text-ink-4">/ mo at current routing</span>
        </span>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left">
          <caption className="sr-only">Monthly volume and default model per kind of work</caption>
          <thead>
            <tr className="border-b border-line-subtle text-[10.5px] uppercase tracking-[0.07em] text-ink-4">
              <th scope="col" className="px-4 py-2 font-medium">Kind of work</th>
              <th scope="col" className="px-3 py-2 font-medium">Runs / month</th>
              <th scope="col" className="px-3 py-2 font-medium">You use</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Tokens in / out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {TASK_TYPES.map((taskType) => {
              const profile = byType.get(taskType);
              const update = (patch: Parameters<typeof updateTaskProfile>[1]) =>
                updateTaskProfile(taskType, patch);
              return (
                <tr key={taskType}>
                  <th
                    scope="row"
                    className="whitespace-nowrap px-4 py-2 text-left text-[12.5px] font-normal text-ink-2"
                  >
                    {TASK_LABEL[taskType]}
                  </th>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label={`Runs per month for ${TASK_LABEL[taskType]}`}
                      value={profile?.runsPerMonth ?? 0}
                      onChange={(event) =>
                        update({ runsPerMonth: Math.max(0, Number(event.target.value) || 0) })
                      }
                      className="h-7 w-24 font-mono text-[12px]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      aria-label={`Model used for ${TASK_LABEL[taskType]}`}
                      value={profile?.currentModelId ?? ""}
                      onChange={(event) => update({ currentModelId: event.target.value })}
                      className="h-7 w-44 text-[12px]"
                    >
                      <option value="">Not set</option>
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="inline-flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`Average input tokens for ${TASK_LABEL[taskType]}`}
                        value={profile?.avgTokensIn ?? 0}
                        onChange={(event) =>
                          update({ avgTokensIn: Math.max(0, Number(event.target.value) || 0) })
                        }
                        className="h-7 w-24 font-mono text-[12px]"
                      />
                      <span className="text-ink-4">/</span>
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`Average output tokens for ${TASK_LABEL[taskType]}`}
                        value={profile?.avgTokensOut ?? 0}
                        onChange={(event) =>
                          update({ avgTokensOut: Math.max(0, Number(event.target.value) || 0) })
                        }
                        className="h-7 w-24 font-mono text-[12px]"
                      />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
