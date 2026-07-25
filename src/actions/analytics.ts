"use server"

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

export async function getDashboardKPIsAction() {
  await requireAuth();

  const [
    totalInfluencers,
    totalClients,
    activeCampaigns,
    revenueAggregate,
    totalTasks,
    doneTasks
  ] = await Promise.all([
    db.influencer.count(),
    db.client.count(),
    db.campaign.count({
      where: { status: "ACTIVE" }
    }),
    db.campaign.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { budget: true }
    }),
    db.task.count(),
    db.task.count({ where: { status: "DONE" } })
  ]);

  const totalRevenue = revenueAggregate._sum.budget || 0;
  const productivity = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return {
    totalInfluencers,
    totalClients,
    activeCampaigns,
    totalRevenue,
    productivity
  };
}

export async function getRevenueChartDataAction() {
  await requireAuth();

  const campaigns = await db.campaign.findMany({
    where: { status: { not: "CANCELLED" } },
    select: { budget: true, createdAt: true },
    orderBy: { createdAt: "asc" }
  });

  // Group by month
  const monthlyData: Record<string, number> = {};
  
  // Initialize last 6 months to ensure we have data points even if empty
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleString('default', { month: 'short' });
    monthlyData[monthStr] = 0;
  }

  campaigns.forEach(c => {
    const monthStr = c.createdAt.toLocaleString('default', { month: 'short' });
    if (monthlyData[monthStr] !== undefined) {
      monthlyData[monthStr] += (c.budget || 0);
    }
  });

  return Object.entries(monthlyData).map(([name, revenue]) => ({
    name,
    revenue
  }));
}

export async function getCampaignPerformanceAction() {
  await requireAuth();

  const counts = await db.campaign.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  const formatted = counts.map(c => ({
    name: c.status.charAt(0) + c.status.slice(1).toLowerCase(),
    value: c._count.status
  }));

  // Ensure we have some base structure even if empty
  if (formatted.length === 0) {
    return [
      { name: "Planning", value: 0 },
      { name: "Active", value: 0 },
      { name: "Completed", value: 0 },
    ];
  }

  return formatted;
}

export async function getTopInfluencersAction() {
  await requireAuth();

  const influencers = await db.influencer.findMany({
    orderBy: { engagementRate: 'desc' },
    take: 5,
    select: {
      id: true,
      instagramHandle: true,
      influencerName: true,
      profileImage: true,
      followers: true,
      engagementRate: true
    }
  });

  return influencers;
}

// ============================================================================
// Enterprise Analytics 
// ============================================================================

export async function getEnterpriseAnalyticsWidgetsAction() {
  try {
    await requireAuth();

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    // Fetch required data
    const [
      lateTasksCount,
      pendingDeliverablesCount,
      upcomingTasksCount,
      upcomingCampaignsCount,
      invoices,
      campaigns
    ] = await Promise.all([
      db.task.count({
        where: {
          dueDate: { lt: now },
          status: { not: "DONE" }
        }
      }),
      db.campaignInfluencer.count({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] }
        }
      }),
      db.task.count({
        where: {
          dueDate: { gte: now, lte: nextWeek },
          status: { not: "DONE" }
        }
      }),
      db.campaign.count({
        where: {
          endDate: { gte: now, lte: nextWeek },
          status: { not: "COMPLETED" }
        }
      }),
      db.invoice.findMany({
        select: { amount: true, status: true }
      }),
      db.campaign.findMany({
        select: { budget: true }
      })
    ]);

    // Health Score
    // Start at 100, -2 for each late task, -1 for each pending deliverable
    let healthScore = 100 - (lateTasksCount * 2) - pendingDeliverablesCount;
    if (healthScore < 0) healthScore = 0;
    if (healthScore > 100) healthScore = 100;

    // Risk Level
    let risk = "Low";
    if (healthScore < 50) risk = "High";
    else if (healthScore <= 80) risk = "Medium";

    // ROI
    const totalRevenue = invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    
    let roi = 0;
    if (totalBudget > 0) {
      roi = ((totalRevenue - totalBudget) / totalBudget) * 100;
    }

    return {
      success: true,
      data: {
        healthScore,
        risk,
        lateTasks: lateTasksCount,
        pendingDeliverables: pendingDeliverablesCount,
        upcomingDeadlines: upcomingTasksCount + upcomingCampaignsCount,
        roi: parseFloat(roi.toFixed(1))
      }
    };
  } catch (error: any) {
    console.error("Failed to fetch analytics widgets", error);
    return { success: false, error: error.message };
  }
}

export async function getEnterpriseAnalyticsChartsAction() {
  try {
    await requireAuth();

    // We fetch everything concurrently to speed up the dashboard
    const [
      projects,
      campaigns,
      tasks,
      invoices,
      posts,
      reels
    ] = await Promise.all([
      db.project.findMany({
        include: { tasks: { select: { status: true } } }
      }),
      db.campaign.findMany({
        include: { tasks: { select: { status: true } }, influencers: { select: { fee: true } } }
      }),
      db.task.findMany({
        select: { createdAt: true, updatedAt: true, status: true }
      }),
      db.invoice.findMany({
        select: { createdAt: true, amount: true, status: true }
      }),
      db.influencerPost.findMany({
        select: { likes: true, comments: true, publishedDate: true }
      }),
      db.influencerReel.findMany({
        select: { likes: true, comments: true, views: true, publishedDate: true }
      })
    ]);

    // 1. Project Progress
    const projectProgress = projects.map(p => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter(t => t.status === "DONE").length;
      return {
        name: p.name.substring(0, 15) + (p.name.length > 15 ? "..." : ""),
        completion: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    }).slice(0, 5); // top 5 projects

    // 2. Campaign Progress
    const campaignProgress = campaigns.map(c => {
      const totalTasks = c.tasks.length;
      const completedTasks = c.tasks.filter(t => t.status === "DONE").length;
      return {
        name: c.name.substring(0, 15) + (c.name.length > 15 ? "..." : ""),
        completion: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    }).slice(0, 5);

    // 3. Task Burn Down (Grouped by month for simplicity)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const burnDown = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthStr = monthNames[d.getMonth()];
      
      const createdInMonth = tasks.filter(t => new Date(t.createdAt).getMonth() === d.getMonth() && new Date(t.createdAt).getFullYear() === d.getFullYear()).length;
      const completedInMonth = tasks.filter(t => t.status === "DONE" && new Date(t.updatedAt).getMonth() === d.getMonth() && new Date(t.updatedAt).getFullYear() === d.getFullYear()).length;
      
      return {
        month: monthStr,
        created: createdInMonth,
        completed: completedInMonth
      };
    });

    // 4. Budget Usage
    const budgetUsage = campaigns.map(c => {
      const totalFees = c.influencers.reduce((sum, inf) => sum + inf.fee, 0);
      return {
        name: c.name.substring(0, 15) + (c.name.length > 15 ? "..." : ""),
        budget: c.budget,
        usage: totalFees
      };
    }).slice(0, 5);

    // 5. Revenue
    const revenue = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthStr = monthNames[d.getMonth()];
      
      const revInMonth = invoices
        .filter(inv => inv.status === "PAID" && new Date(inv.createdAt).getMonth() === d.getMonth() && new Date(inv.createdAt).getFullYear() === d.getFullYear())
        .reduce((sum, inv) => sum + inv.amount, 0);
      
      return {
        month: monthStr,
        amount: revInMonth
      };
    });

    // 6. Influencer Performance (Engagement per post type over time - simple mock grouping)
    const engagementTimeline = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthStr = monthNames[d.getMonth()];
      
      const postsInMonth = posts.filter(p => new Date(p.publishedDate).getMonth() === d.getMonth() && new Date(p.publishedDate).getFullYear() === d.getFullYear());
      const reelsInMonth = reels.filter(r => new Date(r.publishedDate).getMonth() === d.getMonth() && new Date(r.publishedDate).getFullYear() === d.getFullYear());
      
      const postEngagement = postsInMonth.reduce((sum, p) => sum + p.likes + p.comments, 0);
      const reelEngagement = reelsInMonth.reduce((sum, r) => sum + r.likes + r.comments + r.views, 0);

      return {
        month: monthStr,
        posts: postEngagement,
        reels: reelEngagement
      };
    });

    // 7. Overall Completion Breakdown
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter(t => t.status === "TODO").length;
    const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;
    const reviewTasks = tasks.filter(t => t.status === "REVIEW").length;
    const doneTasks = tasks.filter(t => t.status === "DONE").length;
    
    const completionBreakdown = [
      { name: "To Do", value: todoTasks },
      { name: "In Progress", value: inProgressTasks },
      { name: "Review", value: reviewTasks },
      { name: "Done", value: doneTasks }
    ];

    // Timeline for events/campaigns
    const upcomingEvents = campaigns
      .filter(c => c.startDate && c.startDate >= now)
      .map(c => ({
        name: c.name,
        date: c.startDate,
        type: "Campaign Start"
      }))
      .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime())
      .slice(0, 5);

    return {
      success: true,
      data: {
        projectProgress,
        campaignProgress,
        burnDown,
        budgetUsage,
        revenue,
        engagementTimeline,
        completionBreakdown,
        upcomingEvents
      }
    };
  } catch (error: any) {
    console.error("Failed to fetch analytics charts", error);
    return { success: false, error: error.message };
  }
}
