"use client";

import { useEffect } from "react";
import { useUiStore } from "@/lib/store/ui";

/**
 * Names the current record in the top-bar breadcrumb and the browser tab.
 * Detail routes are client components, so metadata cannot do this statically.
 */
export function usePageTitle(title: string | null) {
  const setPageTitle = useUiStore((s) => s.setPageTitle);

  useEffect(() => {
    setPageTitle(title);
    if (title) document.title = `${title} · AI Command Center`;
    return () => {
      setPageTitle(null);
    };
  }, [title, setPageTitle]);
}
