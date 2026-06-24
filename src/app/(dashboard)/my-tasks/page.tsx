import { Metadata } from "next";
import { getTasksAction } from "@/actions/tasks";
import { getAllUsersBasicAction } from "@/actions/users";
import { getCampaignsAction } from "@/actions/campaigns";
import { requireAuth } from "@/lib/auth-utils";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "My Tasks",
  description: "View your assigned tasks.",
};

export default async function MyTasksPage() {
  const session = await requireAuth();

  const [tasks, users, campaignsRes] = await Promise.all([
    getTasksAction({ assigneeId: session.id }),
    getAllUsersBasicAction(),
    getCampaignsAction({ limit: 100 }),
  ]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6">
      {/* Page Header */}
      <PageHeader 
        title="My Tasks" 
        description="Focus on the work assigned specifically to you." 
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
