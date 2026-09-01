import { ProjectDetail } from "@/features/projects/project-detail";
import { SEED_PROJECTS } from "@/lib/data/seed/projects";

export function generateStaticParams() {
  return SEED_PROJECTS.map((project) => ({ id: project.id }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
