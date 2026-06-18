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
