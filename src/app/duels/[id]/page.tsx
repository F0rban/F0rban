import { DuelDetail } from "@/features/duels/duel-detail";
import { generateDuels } from "@/lib/data/seed/duels";

export function generateStaticParams() {
  return generateDuels(new Date()).map((duel) => ({ id: duel.id }));
}

export default async function DuelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DuelDetail id={id} />;
}
