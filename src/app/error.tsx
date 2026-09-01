"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary.
 *
 * The workspace lives in localStorage, so the most likely cause of a crash here
 * is a workspace that a schema change or a bad import left in a shape the app
 * cannot read. The recovery path says so and offers the reset.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-lg flex-col items-center justify-center px-5 text-center">
      <span className="grid size-10 place-items-center rounded-xl border border-negative/25 bg-negative-soft text-negative">
        <TriangleAlert className="size-5" />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-ink">
        Something broke on this page
      </h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
        The rest of the app is fine. If this keeps happening, the workspace stored in this browser
        may be in a shape the app cannot read — resetting it restores the sample data.
      </p>

      {error.digest && (
        <p className="mt-3 font-mono text-[10.5px] text-ink-4">digest {error.digest}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" size="sm" onClick={reset}>
          <RotateCcw className="size-3.5" />
          Try again
        </Button>
        <Button size="sm" asChild>
          <Link href="/">Back to the dashboard</Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-negative hover:bg-negative-soft"
          onClick={() => {
            try {
              window.localStorage.removeItem("acc.workspace.v1");
            } catch {
              // Nothing more we can do; the reload will still try a fresh seed.
            }
            window.location.href = "/";
          }}
        >
          Reset workspace data
        </Button>
      </div>
    </div>
  );
}
