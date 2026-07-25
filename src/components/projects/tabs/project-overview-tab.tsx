import React from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { FolderKanban, CheckCircle, Users, DollarSign } from "lucide-react";
import { PremiumCard } from "@/components/ui/premium-card";

export function ProjectOverviewTab({ project }: { project: any }) {
  const activeCampaigns = project.campaigns.filter((c: any) => c.status === "ACTIVE").length;
  const activeTasks = project.tasks.filter((t: any) => t.status !== "DONE").length;
  
  // Calculate unique team members
  const teamMemberIds = new Set<string>();
  project.campaigns.forEach((c: any) => {
    c.teamMembers.forEach((tm: any) => teamMemberIds.add(tm.userId));
  });
  project.tasks.forEach((t: any) => {
    if (t.assigneeId) teamMemberIds.add(t.assigneeId);
  });
  const teamSize = teamMemberIds.size;

  const totalBudget = project.campaigns.reduce((acc: number, c: any) => acc + (c.budget || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Campaigns"
          value={activeCampaigns.toString()}
          icon={<FolderKanban className="h-5 w-5 text-white/90" />}
          accent="bg-[var(--color-brand-500)]"
          index={0}
        />
        <StatCard
          label="Pending Tasks"
          value={activeTasks.toString()}
          icon={<CheckCircle className="h-5 w-5 text-white/90" />}
          accent="bg-emerald-500"
          index={1}
        />
        <StatCard
          label="Team Size"
          value={teamSize.toString()}
          icon={<Users className="h-5 w-5 text-white/90" />}
          accent="bg-blue-500"
          index={2}
        />
        <StatCard
          label="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-white/90" />}
          accent="bg-amber-500"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {project.campaigns.flatMap((c: any) => c.activities).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="flex flex-col border-b border-[rgba(0,0,0,0.05)] pb-3 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{activity.details}</span>
                <span className="text-xs text-[var(--color-text-muted)] mt-1">{new Date(activity.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {project.campaigns.flatMap((c: any) => c.activities).length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">No recent activity.</p>
            )}
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Upcoming Tasks</h3>
          <div className="space-y-4">
            {project.tasks.filter((t: any) => t.status !== "DONE" && t.dueDate).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex justify-between items-center border-b border-[rgba(0,0,0,0.05)] pb-3 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">{task.title}</span>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-500/10 text-amber-600">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
            {project.tasks.filter((t: any) => t.status !== "DONE" && t.dueDate).length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">No upcoming tasks.</p>
            )}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
