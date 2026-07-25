import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getProjectByIdAction, getProjectsAction } from "@/actions/projects";
import { getClientsAction } from "@/actions/clients";
import { getUsersAction } from "@/actions/users";
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

  const [project, clientsData, projects, usersData] = await Promise.all([
    getProjectByIdAction(projectId),
    getClientsAction({ limit: 500 }),
    getProjectsAction(),
    getUsersAction(),
  ]);

  if (!project) {
    notFound();
  }

  return <ProjectDetailsClient project={project} clients={clientsData.clients} projects={projects} users={usersData} />;
}
