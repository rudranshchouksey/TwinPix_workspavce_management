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

export default async function MyTasksPage({ searchParams }: { searchParams: any }) {
  const session = await requireAuth();

  const parseArray = (val: string | string[] | undefined | null) => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val;
    return val.split(",");
  };
  
  const resolvedSearchParams = await searchParams;

  const serverFilters = {
    search: typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined,
    statuses: parseArray(resolvedSearchParams.statuses),
    priorities: parseArray(resolvedSearchParams.priorities),
    assigneeIds: [session.id], // Force to current user
    campaignIds: parseArray(resolvedSearchParams.campaignIds),
    isOverdue: resolvedSearchParams.isOverdue === "true" ? true : undefined,
    sortBy: typeof resolvedSearchParams.sortBy === 'string' ? resolvedSearchParams.sortBy : undefined,
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
    <MyTasksPageClient
      initialTasksData={tasksRes}
      users={users}
      campaigns={campaignsRes.campaigns}
      kpis={kpis}
      insights={insights}
      currentUserId={session.id}
    />
  );
}
