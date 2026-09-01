"use client";

import { FlaskConical, X } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { useUiStore } from "@/lib/store/ui";
import { cn } from "@/lib/utils/cn";

/**
 * Says out loud that the evidence on screen is not yet the user's.
 *
 * A product whose entire pitch is "this is *your* record" cannot quietly show
 * someone else's and hope nobody notices. It stays until they clear it.
 */
export function SampleBanner({ className }: { className?: string }) {
  const { workspace, ready } = useWorkspace();
  const clearSampleEvidence = useWorkspaceStore((s) => s.clearSampleEvidence);
  const toast = useUiStore((s) => s.toast);

  if (!ready || !workspace?.preferences.usingSampleData) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-dashed border-accent-line/70 bg-accent-soft/40 px-3.5 py-2.5",
        "sm:flex-row sm:items-center",
        className,
      )}
    >
      <FlaskConical className="size-3.5 shrink-0 text-accent" />
      <p className="min-w-0 flex-1 text-[11.5px] leading-snug text-ink-2">
        <span className="font-medium text-ink">This is sample evidence.</span> 70 duels from a
        worked example, so the routing table is not empty while you build your own record.
      </p>
      <button
        type="button"
        onClick={() => {
          clearSampleEvidence();
          toast({
            title: "Sample evidence cleared",
            description: "Your prompts and models stayed. Run a duel to start your own record.",
            tone: "success",
          });
        }}
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-accent-line/60 bg-surface-1 px-2 py-1 text-[11.5px] font-medium text-accent transition-colors hover:bg-accent-soft sm:self-auto"
      >
        <X className="size-3" />
        Start my own record
      </button>
    </div>
  );
}
