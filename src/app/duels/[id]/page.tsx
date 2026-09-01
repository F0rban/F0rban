"use client";

import { use } from "react";
import { DuelDetail } from "@/features/duels/duel-detail";

/**
 * Route wrapper only. The view takes a plain id so it can be rendered — and
 * tested — without a params promise to suspend on.
 */
export default function DuelPage({ params }: { params: Promise<{ id: string }> }) {
  return <DuelDetail id={use(params).id} />;
}
