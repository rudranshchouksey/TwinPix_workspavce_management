import { Metadata } from "next";
import { getTasksAction, getTaskKpisAction } from "@/actions/tasks";
import { getTaskInsightsAction } from "@/actions/task-insights";
import { getAllUsersBasicAction } from "@/actions/users";
import { getCampaignsAction } from "@/actions/campaigns";
import { requireAuth } from "@/lib/auth-utils";
import { MyTasksPageClient } from "@/components/tasks/my-tasks-page-client";

export const metadata: Metadata = {
  title: "My Tasks",
  description: "View your assigned tasks and track personal productivity.",
};

export default async function MyTasksPage() {
  const session = await requireAuth();

  const [tasks, users, campaignsRes, kpis, insights] = await Promise.all([
    getTasksAction({ assigneeId: session.id }),
    getAllUsersBasicAction(),
    getCampaignsAction({ limit: 100 }),
    getTaskKpisAction(),
    getTaskInsightsAction(),
  ]);

  return (
    <MyTasksPageClient
      tasks={tasks}
      users={users}
      campaigns={campaignsRes.campaigns}
      kpis={kpis}
      insights={insights}
      currentUserId={session.id}
    />
  );
}
