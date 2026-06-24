import { db } from "@/lib/db";

export interface CampaignInsight {
  id: string;
  type: "attention" | "deadline" | "performance" | "deliverables";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  count?: number;
}

export class CampaignInsightsService {
  async generate(): Promise<CampaignInsight[]> {
    const insights: CampaignInsight[] = [];

    const [campaigns, assignments, overdueTasks] = await Promise.all([
      db.campaign.findMany({
        where: { isArchived: false, status: { in: ["PLANNING", "ACTIVE", "REVIEW"] } },
        select: { id: true, name: true, status: true, endDate: true, _count: { select: { influencers: true } } },
      }),
      db.campaignInfluencer.findMany({
        where: { campaign: { isArchived: false, status: { not: "CANCELLED" } } },
        select: {
          status: true,
          influencer: { select: { category: true, engagementRate: true } },
        },
      }),
      db.task.count({
        where: { campaignId: { not: null }, status: { not: "DONE" }, dueDate: { lt: new Date() } },
      }),
    ]);

    const needsInfluencers = campaigns.filter((c) => c.status === "ACTIVE" && c._count.influencers === 0);
    const attentionCount = needsInfluencers.length + (overdueTasks > 0 ? 1 : 0);
    if (needsInfluencers.length > 0) {
      insights.push({
        id: "attention-no-influencers",
        type: "attention",
        severity: "high",
        title: `${needsInfluencers.length} campaign${needsInfluencers.length === 1 ? "" : "s"} require attention`,
        description: `${needsInfluencers.map((c) => c.name).slice(0, 3).join(", ")} ${needsInfluencers.length > 3 ? "and others " : ""}are active with no influencers assigned yet.`,
        count: needsInfluencers.length,
      });
    }

    if (overdueTasks > 0) {
      insights.push({
        id: "attention-overdue-tasks",
        type: "attention",
        severity: "high",
        title: `${overdueTasks} overdue task${overdueTasks === 1 ? "" : "s"} on campaigns`,
        description: "Some campaign-linked tasks are past their due date and need follow-up.",
        count: overdueTasks,
      });
    }

    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const approachingDeadline = campaigns.filter((c) => c.endDate && c.endDate >= now && c.endDate <= sevenDaysOut);
    if (approachingDeadline.length > 0) {
      insights.push({
        id: "deadline-approaching",
        type: "deadline",
        severity: "medium",
        title: `${approachingDeadline.length} campaign${approachingDeadline.length === 1 ? "" : "s"} approaching deadline`,
        description: `${approachingDeadline.map((c) => c.name).slice(0, 3).join(", ")} ${approachingDeadline.length > 3 ? "and others " : ""}end within the next 7 days.`,
        count: approachingDeadline.length,
      });
    }

    const pendingDeliverables = assignments.filter((a) => a.status !== "DELIVERED").length;
    if (pendingDeliverables > 0) {
      insights.push({
        id: "deliverables-pending",
        type: "deliverables",
        severity: "low",
        title: `${pendingDeliverables} influencer${pendingDeliverables === 1 ? "" : "s"} with pending deliverables`,
        description: "These creators haven't marked their deliverables as completed yet across active campaigns.",
        count: pendingDeliverables,
      });
    }

    const byCategory = new Map<string, { sum: number; n: number }>();
    for (const a of assignments) {
      const category = a.influencer.category?.split(",")[0]?.trim();
      if (!category || a.influencer.engagementRate == null) continue;
      const bucket = byCategory.get(category) || { sum: 0, n: 0 };
      bucket.sum += a.influencer.engagementRate;
      bucket.n += 1;
      byCategory.set(category, bucket);
    }
    const categoryAverages = Array.from(byCategory.entries())
      .filter(([, v]) => v.n >= 1)
      .map(([category, v]) => ({ category, avg: v.sum / v.n }))
      .sort((a, b) => b.avg - a.avg);

    if (categoryAverages.length >= 2) {
      const [top, second] = categoryAverages;
      const diffPct = second.avg > 0 ? Math.round(((top.avg - second.avg) / second.avg) * 100) : 0;
      if (diffPct > 0) {
        insights.push({
          id: "performance-category-comparison",
          type: "performance",
          severity: "low",
          title: `${top.category} campaigns are outperforming ${second.category} by ${diffPct}%`,
          description: `Based on average influencer engagement rate across currently assigned creators (${top.avg.toFixed(1)}% vs ${second.avg.toFixed(1)}%).`,
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        id: "all-clear",
        type: "performance",
        severity: "low",
        title: "Everything's on track",
        description: "No campaigns currently need attention. Great work staying ahead of deadlines and deliverables.",
      });
    }

    return insights;
  }
}
