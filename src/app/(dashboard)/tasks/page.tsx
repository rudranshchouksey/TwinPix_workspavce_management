import { Metadata } from "next";
import { getTasksAction } from "@/actions/tasks";
import { getAllUsersBasicAction } from "@/actions/users";
import { getCampaignsAction } from "@/actions/campaigns";
import { requireAuth } from "@/lib/auth-utils";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader 
        title="Task Management" 
        description="Organize work, track progress, and collaborate with your team." 
      />

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
