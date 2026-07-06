import { Metadata } from "next";
import { getTasksAction, getTaskKpisAction } from "@/actions/tasks";
import { getTaskInsightsAction } from "@/actions/task-insights";
import { getAllUsersBasicAction } from "@/actions/users";
import { getCampaignsAction } from "@/actions/campaigns";
import { requireAuth } from "@/lib/auth-utils";
import { TaskPageClient } from "@/components/tasks/task-page-client";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Manage internal tasks and track progress.",
};

export default async function TasksPage() {
  const session = await requireAuth();

  const [tasks, users, campaignsRes, kpis, insights] = await Promise.all([
    getTasksAction({}),
    getAllUsersBasicAction(),
    getCampaignsAction({ limit: 100 }),
    getTaskKpisAction(),
    getTaskInsightsAction(),
  ]);

  return (
    <TaskPageClient
      tasks={tasks}
      users={users}
      campaigns={campaignsRes.campaigns}
      kpis={kpis}
      insights={insights}
      currentUserId={session.id}
    />
  );
}
