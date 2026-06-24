import { Metadata } from "next";
import { getProjectsAction } from "@/actions/projects";
import { getClientsAction } from "@/actions/clients";
import { requireAuth } from "@/lib/auth-utils";
import { ProjectsView } from "@/components/projects/projects-view";
import { FolderKanban } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Projects",
  description: "View and manage all active projects.",
};

export default async function ProjectsPage() {
  await requireAuth();

  const [projects, clientsRes] = await Promise.all([
    getProjectsAction(),
    getClientsAction({ limit: 500 }),
  ]);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projects" 
        description="Group multiple campaigns into higher-level projects." 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Projects"
          value={projects.length.toString()}
          icon={<FolderKanban className="h-5 w-5 text-white/90" />}
          accent="bg-[var(--color-brand-500)]"
          index={0}
        />
        <StatCard
          label="Active Projects"
          value={activeProjects.toString()}
          icon={<FolderKanban className="h-5 w-5 text-white/90" />}
          accent="bg-emerald-500"
          index={1}
        />
        <StatCard
          label="Completed"
          value={completedProjects.toString()}
          icon={<FolderKanban className="h-5 w-5 text-white/90" />}
          accent="bg-blue-500"
          index={2}
        />
      </div>

      <ProjectsView initialProjects={projects} clients={clientsRes.clients} />
    </div>
  );
}
