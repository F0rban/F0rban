"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useUiStore, type ToastTone } from "@/lib/store/ui";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<ToastTone, React.ElementType> = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

const TONES: Record<ToastTone, string> = {
  default: "text-ink-3",
  success: "text-positive",
  warning: "text-warning",
  danger: "text-negative",
};

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-5"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-2.5",
              "rounded-lg border border-line bg-overlay p-3 shadow-lg",
            )}
          >
            <Icon className={cn("mt-px size-4 shrink-0", TONES[toast.tone])} />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium leading-snug text-ink">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">{toast.description}</p>
              )}
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action!.run();
                    dismiss(toast.id);
                  }}
                  className="mt-1.5 text-[11.5px] font-medium text-accent hover:underline"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-m-1 grid size-6 shrink-0 place-items-center rounded text-ink-4 transition-colors hover:bg-surface-2 hover:text-ink-2"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
