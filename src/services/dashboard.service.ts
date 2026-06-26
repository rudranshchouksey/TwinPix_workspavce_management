import { db } from "@/lib/db";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export interface DashboardMetrics {
  kpis: {
    influencers: { total: number; change: string; trend: "up" | "down" | "neutral"; data: number[] };
    campaigns: { total: number; change: string; trend: "up" | "down" | "neutral"; data: number[] };
    revenue: { total: number; change: string; trend: "up" | "down" | "neutral"; data: number[] };
    tasks: { total: number; change: string; trend: "up" | "down" | "neutral"; data: number[] };
  };
  summary: {
    influencers: number;
    activeClients: number;
    runningCampaigns: number;
    pendingTasks: number;
    teamMembers: number;
    projects: number;
  };
  insights: { title: string; subtitle: string; description: string; href: string; actionText: string }[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const sixMonthsAgo = startOfMonth(subMonths(now, 6)); // We'll show 7 months of data [T-6, T-5, ... T]

  const [
    totalInfluencers,
    activeCampaigns,
    allCampaignsAgg,
    completedTasks,
    activeClients,
    runningCampaigns,
    pendingTasks,
    teamMembers,
    projects,
    influencersRecent,
    campaignsRecent,
    tasksRecent,
    newLeadInfluencers,
    overdueTasks
  ] = await Promise.all([
    db.influencer.count(),
    db.campaign.count({ where: { status: "ACTIVE" } }),
    db.campaign.aggregate({ _sum: { budget: true } }),
    db.task.count({ where: { status: "DONE" } }),
    db.client.count({ where: { status: "ACTIVE" } }),
    db.campaign.count({ where: { status: "ACTIVE" } }),
    db.task.count({ where: { status: { not: "DONE" } } }),
    db.user.count({ where: { role: { in: ["SUPER_ADMIN", "ADMIN", "TEAM_MEMBER"] }, status: "ACTIVE" } }),
    db.project.count({ where: { status: "ACTIVE" } }),
    
    // For sparklines and trends, fetch recent data
    db.influencer.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    }),
    db.campaign.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, budget: true }
    }),
    db.task.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, status: "DONE" },
      select: { createdAt: true }
    }),
    
    // For AI insights
    db.influencer.count({ where: { status: "NEW_LEAD" } }),
    db.task.count({ where: { dueDate: { lt: now }, status: { not: "DONE" } } })
  ]);

  const totalRevenue = allCampaignsAgg._sum.budget ?? 0;

  // Helper to group by month
  const groupMonthly = (items: { createdAt: Date, value?: number }[]) => {
    const buckets = new Array(7).fill(0);
    items.forEach(item => {
      const diffMonths = (now.getFullYear() - item.createdAt.getFullYear()) * 12 + now.getMonth() - item.createdAt.getMonth();
      if (diffMonths >= 0 && diffMonths < 7) {
        buckets[6 - diffMonths] += (item.value ?? 1);
      }
    });
    return buckets; // [Month -6, ..., Month 0]
  };

  const infMonthly = groupMonthly(influencersRecent.map(i => ({ createdAt: i.createdAt })));
  const campMonthly = groupMonthly(campaignsRecent.map(c => ({ createdAt: c.createdAt })));
  const revMonthly = groupMonthly(campaignsRecent.map(c => ({ createdAt: c.createdAt, value: c.budget ?? 0 })));
  const tasksMonthly = groupMonthly(tasksRecent.map(t => ({ createdAt: t.createdAt })));

  const getChangeAndTrend = (current: number, previous: number, isCurrency: boolean = false): { change: string; trend: "up" | "down" | "neutral" } => {
    if (previous === 0) {
      if (current === 0) return { change: "No historical trend available", trend: "neutral" };
      return { change: `100% this month`, trend: "up" };
    }
    const percent = ((current - previous) / previous) * 100;
    const absPercent = Math.abs(percent).toFixed(1);
    const sign = percent > 0 ? "+" : "-";
    const trend = percent > 0 ? "up" : percent < 0 ? "down" : "neutral";
    return {
      change: `${sign}${absPercent}% this month`,
      trend
    };
  };

  const infMetrics = getChangeAndTrend(infMonthly[6], infMonthly[5]);
  const campMetrics = getChangeAndTrend(campMonthly[6], campMonthly[5]);
  const revMetrics = getChangeAndTrend(revMonthly[6], revMonthly[5], true);
  const tasksMetrics = getChangeAndTrend(tasksMonthly[6], tasksMonthly[5]);

  // Generate dynamic AI insights
  const insights: DashboardMetrics["insights"] = [];
  
  if (newLeadInfluencers > 0) {
    insights.push({
      title: "Growth Opportunity",
      subtitle: "Uncontacted Leads",
      description: `You have ${newLeadInfluencers} influencers that have not been contacted.`,
      href: "/influencers",
      actionText: "View Leads"
    });
  }

  if (overdueTasks > 0) {
    insights.push({
      title: "Action Required",
      subtitle: `${overdueTasks} tasks are overdue`,
      description: `${overdueTasks} tasks are overdue.`,
      href: "/my-tasks",
      actionText: "View Tasks"
    });
  }

  if (activeCampaigns === 0) {
    insights.push({
      title: "Get Started",
      subtitle: "No active campaigns",
      description: "No active campaigns found. Create your first campaign.",
      href: "/campaigns",
      actionText: "Create Campaign"
    });
  } else if (activeCampaigns > 5) {
    insights.push({
      title: "Campaign Momentum",
      subtitle: `${activeCampaigns} campaigns running`,
      description: `${activeCampaigns} campaigns are currently running.`,
      href: "/analytics",
      actionText: "View Analytics"
    });
  }

  // Fallback if not enough insights
  if (insights.length === 0) {
    insights.push({
      title: "Workspace Optimal",
      subtitle: "Everything looks good",
      description: "Your workspace is healthy and operating normally.",
      href: "/projects",
      actionText: "View Projects"
    });
  }

  return {
    kpis: {
      influencers: { total: totalInfluencers, change: infMetrics.change, trend: infMetrics.trend, data: infMonthly },
      campaigns: { total: activeCampaigns, change: campMetrics.change, trend: campMetrics.trend, data: campMonthly },
      revenue: { total: totalRevenue, change: revMetrics.change, trend: revMetrics.trend, data: revMonthly },
      tasks: { total: completedTasks, change: tasksMetrics.change, trend: tasksMetrics.trend, data: tasksMonthly },
    },
    summary: {
      influencers: totalInfluencers,
      activeClients,
      runningCampaigns,
      pendingTasks,
      teamMembers,
      projects
    },
    insights: insights.slice(0, 2) // keep max 2 insights
  };
}
