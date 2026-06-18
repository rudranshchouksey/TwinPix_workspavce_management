import { Metadata } from "next";
import { getTasksAction } from "@/actions/tasks";
import { getAllUsersBasicAction } from "@/actions/users";
import { getCampaignsAction } from "@/actions/campaigns";
import { requireAuth } from "@/lib/auth-utils";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { CheckCircle2 } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[var(--color-brand-500)]" />
            My Tasks
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Focus on the work assigned specifically to you.
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
