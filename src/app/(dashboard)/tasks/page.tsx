import { Metadata } from "next";
import { getTasksAction } from "@/actions/tasks";
import { getAllUsersBasicAction } from "@/actions/users";
import { getCampaignsAction } from "@/actions/campaigns";
import { requireAuth } from "@/lib/auth-utils";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { CheckSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Manage internal tasks and track progress.",
};

export default async function TasksPage() {
  await requireAuth();

  const [tasks, users, campaignsRes] = await Promise.all([
    getTasksAction({}),
    getAllUsersBasicAction(),
    getCampaignsAction({ limit: 100 }),
  ]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[var(--color-brand-500)]" />
            Task Management
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Organize work, track progress, and collaborate with your team.
          </p>
        </div>
      </div>

      {/* Main Kanban Area */}
      <div className="flex-1 overflow-hidden">
        <TaskKanban 
          initialData={tasks} 
          users={users} 
          campaigns={campaignsRes.campaigns} 
        />
      </div>
    </div>
  );
}
