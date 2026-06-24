import { db } from "@/lib/db";
import { computeNextFollowUp } from "@/components/influencers/pipeline/pipeline-utils";

export interface PipelineInsight {
  id: string;
  type: "followup" | "performance" | "negotiation" | "category";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  count?: number;
}

export class PipelineInsightsService {
  async generate(): Promise<PipelineInsight[]> {
    const insights: PipelineInsight[] = [];

    const influencers = await db.influencer.findMany({
      where: { status: { notIn: ["BLACKLISTED"] } },
      select: {
        id: true,
        status: true,
        category: true,
        engagementRate: true,
        createdAt: true,
        lastContactDate: true,
        negotiationTerms: true,
      },
    });

    const needsFollowUp = influencers.filter((i) => {
      const fu = computeNextFollowUp(i);
      return fu.overdue || fu.daysUntil === 0;
    });
    if (needsFollowUp.length > 0) {
      insights.push({
        id: "followup-today",
        type: "followup",
        severity: "high",
        title: `${needsFollowUp.length} creator${needsFollowUp.length === 1 ? "" : "s"} need${needsFollowUp.length === 1 ? "s" : ""} follow-up today.`,
        description: "These creators are overdue or due for outreach based on their pipeline stage and last contact date.",
        count: needsFollowUp.length,
      });
    }

    const negotiating = influencers.filter((i) => i.status === "NEGOTIATING");
    const stalledNegotiations = negotiating.filter((i) => {
      const baseline = i.lastContactDate ? new Date(i.lastContactDate) : new Date(i.createdAt);
      const daysSince = Math.floor((Date.now() - baseline.getTime()) / (24 * 60 * 60 * 1000));
      return daysSince > 5;
    });
    if (stalledNegotiations.length > 0) {
      insights.push({
        id: "negotiations-pending",
        type: "negotiation",
        severity: "medium",
        title: `${stalledNegotiations.length} negotiation${stalledNegotiations.length === 1 ? "" : "s"} pending for more than 5 days.`,
        description: "These deals haven't moved forward recently — consider a check-in to keep momentum.",
        count: stalledNegotiations.length,
      });
    }

    // Category response-rate comparison: % of creators in category that moved past NEW_LEAD
    const byCategory = new Map<string, { total: number; responded: number; engagementSum: number; engagementN: number }>();
    for (const i of influencers) {
      const category = i.category?.split(",")[0]?.trim();
      if (!category) continue;
      const bucket = byCategory.get(category) || { total: 0, responded: 0, engagementSum: 0, engagementN: 0 };
      bucket.total += 1;
      if (["REPLIED", "NEGOTIATING", "ACTIVE", "ONBOARDED"].includes(i.status)) bucket.responded += 1;
      if (i.engagementRate != null) {
        bucket.engagementSum += i.engagementRate;
        bucket.engagementN += 1;
      }
      byCategory.set(category, bucket);
    }

    const responseRates = Array.from(byCategory.entries())
      .filter(([, v]) => v.total >= 3)
      .map(([category, v]) => ({ category, rate: (v.responded / v.total) * 100 }))
      .sort((a, b) => b.rate - a.rate);

    if (responseRates.length >= 2) {
      const [top, second] = responseRates;
      if (top.rate > second.rate && second.rate > 0) {
        const diff = Math.round(((top.rate - second.rate) / second.rate) * 100);
        if (diff > 0) {
          insights.push({
            id: "category-response-comparison",
            type: "category",
            severity: "low",
            title: `${top.category} creators have ${diff}% higher response rates than ${second.category}.`,
            description: `Based on the share of creators who replied or moved forward (${top.rate.toFixed(0)}% vs ${second.rate.toFixed(0)}%).`,
          });
        }
      }
    }

    const engagementByCategory = Array.from(byCategory.entries())
      .filter(([, v]) => v.engagementN >= 2)
      .map(([category, v]) => ({ category, avg: v.engagementSum / v.engagementN }))
      .sort((a, b) => b.avg - a.avg);

    if (engagementByCategory.length >= 2) {
      const [top, second] = engagementByCategory;
      const diff = second.avg > 0 ? Math.round(((top.avg - second.avg) / second.avg) * 100) : 0;
      if (diff > 0) {
        insights.push({
          id: "category-engagement-comparison",
          type: "performance",
          severity: "low",
          title: `${top.category} creators are outperforming ${second.category} by ${diff}%.`,
          description: `Average engagement rate of ${top.avg.toFixed(1)}% vs ${second.avg.toFixed(1)}% across creators in your pipeline.`,
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        id: "all-clear",
        type: "performance",
        severity: "low",
        title: "Pipeline is healthy",
        description: "No urgent follow-ups or stalled negotiations right now. Keep up the momentum.",
      });
    }

    return insights;
  }
}
