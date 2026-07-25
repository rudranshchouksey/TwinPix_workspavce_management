import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getProjectByIdAction } from "@/actions/projects";
import { notFound } from "next/navigation";
import { ProjectDetailsClient } from "@/components/projects/project-details-client"; // Force TS server refresh

export const metadata: Metadata = {
  title: "Project Details",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await requireAuth();
  const { projectId } = await params;

  const project = await getProjectByIdAction(projectId);

  if (!project) {
    notFound();
  }

  return <ProjectDetailsClient project={project} />;
}
