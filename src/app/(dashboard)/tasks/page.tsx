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

export default async function TasksPage({ searchParams }: { searchParams: any }) {
  const session = await requireAuth();

  const parseArray = (val: string | undefined | null) => (val ? val.split(",") : undefined);
  
  const resolvedSearchParams = await searchParams;

  const serverFilters = {
    search: resolvedSearchParams.search || undefined,
    statuses: parseArray(resolvedSearchParams.statuses),
    priorities: parseArray(resolvedSearchParams.priorities),
    assigneeIds: parseArray(resolvedSearchParams.assigneeIds),
    campaignIds: parseArray(resolvedSearchParams.campaignIds),
    isOverdue: resolvedSearchParams.isOverdue === "true" ? true : undefined,
    sortBy: resolvedSearchParams.sortBy || undefined,
    limit: 50,
  };

  const [tasksRes, users, campaignsRes, kpis, insights] = await Promise.all([
    getTasksAction(serverFilters),
    getAllUsersBasicAction(),
    getCampaignsAction({ limit: 100 }),
    getTaskKpisAction(),
    getTaskInsightsAction(),
  ]);

  return (
    <TaskPageClient
      initialTasksData={tasksRes}
      users={users}
      campaigns={campaignsRes.campaigns}
      kpis={kpis}
      insights={insights}
      currentUserId={session.id}
    />
  );
}
