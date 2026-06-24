"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth-utils";
import { computeNextFollowUp, computePriority, PIPELINE_STATUSES } from "@/components/influencers/pipeline/pipeline-utils";
import { PipelineInsightsService } from "@/services/influencers/pipeline-insights.service";

const prisma = db as any;

// ─── Shared filter shape ──────────────────────────────────────────
export interface PipelineFilters {
  search?: string;
  categories?: string[];
  statuses?: string[];
  followersMin?: number;
  engagementMin?: number;
  needsFollowUp?: boolean;
  hotLead?: boolean; // engagement >= 4% or followers >= 100k
  activeCampaignOnly?: boolean;
  ids?: string[]; // restrict to an explicit set (used for "export selected")
}

function buildWhere(filters: PipelineFilters) {
  const where: any = {};
  const and: any[] = [];

  if (filters.ids?.length) {
    and.push({ id: { in: filters.ids } });
  }

  if (filters.search) {
    and.push({
      OR: [
        { instagramHandle: { contains: filters.search, mode: "insensitive" } },
        { influencerName: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  if (filters.categories?.length) {
    and.push({ category: { in: filters.categories } });
  }

  if (filters.statuses?.length) {
    and.push({ status: { in: filters.statuses } });
  }

  if (filters.followersMin) {
    and.push({ followers: { gte: filters.followersMin } });
  }

  if (filters.engagementMin) {
    and.push({ engagementRate: { gte: filters.engagementMin } });
  }

  if (filters.hotLead) {
    and.push({ OR: [{ engagementRate: { gte: 4 } }, { followers: { gte: 100_000 } }] });
  }

  if (filters.activeCampaignOnly) {
    and.push({ campaigns: { some: { campaign: { status: "ACTIVE" } } } });
  }

  if (and.length) where.AND = and;
  return where;
}

const PIPELINE_INCLUDE = {
  creatorIntelligence: { select: { intelligenceScore: true } },
  assignedManager: { select: { id: true, name: true, image: true } },
  campaigns: {
    where: { campaign: { status: { in: ["ACTIVE", "PLANNING"] } } },
    take: 1,
    orderBy: { createdAt: "desc" as const },
    include: { campaign: { select: { id: true, name: true, status: true } } },
  },
  _count: { select: { campaigns: true } },
};

// ─── CRM Table data ───────────────────────────────────────────────
export async function getPipelineInfluencersAction(
  filters: PipelineFilters,
  page: number = 1,
  limit: number = 50,
  sortBy: string = "createdAt",
  sortOrder: string = "desc"
) {
  await requireAuth();

  const where = buildWhere(filters);
  const skip = (page - 1) * limit;

  const allowedSortFields = ["createdAt", "influencerName", "instagramHandle", "followers", "engagementRate", "lastContactDate", "status"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";

  // needsFollowUp can't be expressed in SQL (cadence is computed in JS), so
  // when active we over-fetch a wider page and filter/paginate in memory.
  if (filters.needsFollowUp) {
    const rows = await prisma.influencer.findMany({
      where,
      orderBy: { [safeSortBy]: safeSortOrder },
      include: PIPELINE_INCLUDE,
      take: 2000,
    });
    const due = rows.filter((r: any) => computeNextFollowUp(r).overdue || computeNextFollowUp(r).daysUntil === 0);
    const total = due.length;
    const paged = due.slice(skip, skip + limit);
    return { influencers: paged, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  const [influencers, total] = await Promise.all([
    prisma.influencer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [safeSortBy]: safeSortOrder },
      include: PIPELINE_INCLUDE,
    }),
    prisma.influencer.count({ where }),
  ]);

  return { influencers, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

// ─── Kanban data (capped per column for performance) ──────────────
export async function getPipelineKanbanDataAction(filters: PipelineFilters, perColumnLimit: number = 60) {
  await requireAuth();
  const baseWhere = buildWhere(filters);

  const columns = await Promise.all(
    PIPELINE_STATUSES.map(async (status) => {
      const where = { ...baseWhere, AND: [...(baseWhere.AND || []), { status }] };
      const [items, total] = await Promise.all([
        prisma.influencer.findMany({
          where,
          take: perColumnLimit,
          orderBy: [{ engagementRate: "desc" }, { createdAt: "desc" }],
          include: PIPELINE_INCLUDE,
        }),
        prisma.influencer.count({ where }),
      ]);
      return { status, items, total };
    })
  );

  return columns;
}

// ─── Priority Queue ────────────────────────────────────────────────
export async function getPriorityQueueAction(limit: number = 40) {
  await requireAuth();

  const candidates = await prisma.influencer.findMany({
    where: { status: { notIn: ["ACTIVE", "ONBOARDED", "BLACKLISTED"] } },
    include: PIPELINE_INCLUDE,
    take: 500,
    orderBy: { createdAt: "desc" },
  });

  const ranked = candidates
    .map((c: any) => ({ influencer: c, priority: computePriority(c), followUp: computeNextFollowUp(c) }))
    .sort((a: any, b: any) => b.priority.score - a.priority.score)
    .slice(0, limit);

  return ranked;
}

// ─── Timeline (global influencer activity feed) ───────────────────
export async function getPipelineTimelineAction(page: number = 1, limit: number = 30) {
  await requireAuth();
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { entityType: "INFLUENCER", NOT: { entityId: "bulk" } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where: { entityType: "INFLUENCER", NOT: { entityId: "bulk" } } }),
  ]);

  const influencerIds = [...new Set(logs.map((l: any) => l.entityId))];
  const influencers = await prisma.influencer.findMany({
    where: { id: { in: influencerIds as string[] } },
    select: { id: true, influencerName: true, instagramHandle: true, profileImage: true },
  });
  const byId = new Map(influencers.map((i: any) => [i.id, i]));

  const items = logs.map((l: any) => ({ ...l, influencer: byId.get(l.entityId) || null }));

  return { items, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

// ─── Calendar (real Events linked to influencers + computed deadlines) ──
export async function getPipelineCalendarDataAction() {
  await requireAuth();

  const [events, activeAssignments] = await Promise.all([
    prisma.event.findMany({
      where: { influencerId: { not: null } },
      include: { influencer: { select: { id: true, influencerName: true, instagramHandle: true } } },
      orderBy: { start: "asc" },
    }),
    prisma.campaignInfluencer.findMany({
      where: { campaign: { status: "ACTIVE", endDate: { not: null } } },
      include: {
        campaign: { select: { id: true, name: true, endDate: true } },
        influencer: { select: { id: true, influencerName: true, instagramHandle: true } },
      },
      take: 300,
    }),
  ]);

  const realEvents = events.map((e: any) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    color: e.color || "#7c3aed",
    editable: true,
    extendedProps: { kind: "EVENT", type: e.type, influencer: e.influencer },
  }));

  const deadlineEvents = activeAssignments
    .filter((a: any) => a.campaign?.endDate)
    .map((a: any) => ({
      id: `deadline-${a.id}`,
      title: `${a.campaign.name} — @${a.influencer.instagramHandle}`,
      start: a.campaign.endDate,
      allDay: true,
      color: "#f59e0b",
      editable: false,
      extendedProps: { kind: "CAMPAIGN_DEADLINE", campaignId: a.campaign.id, influencer: a.influencer },
    }));

  // Computed follow-up due markers for creators currently overdue or due today
  const needingFollowUp = await prisma.influencer.findMany({
    where: { status: { in: ["NEW_LEAD", "CONTACTED", "REPLIED", "NEGOTIATING"] } },
    select: { id: true, influencerName: true, instagramHandle: true, status: true, lastContactDate: true, createdAt: true },
    take: 500,
  });

  const followUpEvents = needingFollowUp
    .map((i: any) => ({ influencer: i, followUp: computeNextFollowUp(i) }))
    .filter(({ followUp }: any) => followUp.dueDate)
    .map(({ influencer, followUp }: any) => ({
      id: `followup-${influencer.id}`,
      title: `Follow up — ${influencer.influencerName || "@" + influencer.instagramHandle}`,
      start: followUp.dueDate,
      allDay: true,
      color: followUp.overdue ? "#ef4444" : "#0ea5e9",
      editable: false,
      extendedProps: { kind: "FOLLOW_UP", influencer },
    }));

  return [...realEvents, ...deadlineEvents, ...followUpEvents];
}

// ─── Bulk actions ───────────────────────────────────────────────────
export async function bulkUpdateInfluencerStatusAction(ids: string[], status: string) {
  const user = await requireAuth();
  if (!ids.length) return { updated: 0 };

  await prisma.influencer.updateMany({ where: { id: { in: ids } }, data: { status } });

  await prisma.auditLog.create({
    data: {
      action: "INFLUENCER_STATUS_CHANGED",
      entityType: "INFLUENCER",
      entityId: "bulk",
      adminId: user.id,
      details: `Bulk changed status to ${status} for ${ids.length} influencer(s)`,
    },
  });

  revalidatePath("/influencers/pipeline");
  return { updated: ids.length };
}

export async function bulkMarkContactedAction(ids: string[]) {
  const user = await requireAuth();
  if (!ids.length) return { updated: 0 };

  await prisma.influencer.updateMany({
    where: { id: { in: ids }, status: "NEW_LEAD" },
    data: { status: "CONTACTED", lastContactDate: new Date() },
  });
  await prisma.influencer.updateMany({
    where: { id: { in: ids }, status: { not: "NEW_LEAD" } },
    data: { lastContactDate: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      action: "INFLUENCER_UPDATED",
      entityType: "INFLUENCER",
      entityId: "bulk",
      adminId: user.id,
      details: `Bulk marked ${ids.length} influencer(s) as contacted`,
    },
  });

  revalidatePath("/influencers/pipeline");
  return { updated: ids.length };
}

export async function bulkAssignManagerAction(ids: string[], managerId: string | null) {
  const user = await requireAuth();
  if (!ids.length) return { updated: 0 };

  await prisma.influencer.updateMany({ where: { id: { in: ids } }, data: { assignedManagerId: managerId } });

  await prisma.auditLog.create({
    data: {
      action: "INFLUENCER_UPDATED",
      entityType: "INFLUENCER",
      entityId: "bulk",
      adminId: user.id,
      details: `Bulk reassigned manager for ${ids.length} influencer(s)`,
    },
  });

  revalidatePath("/influencers/pipeline");
  return { updated: ids.length };
}

export async function bulkDeleteInfluencersAction(ids: string[]) {
  const user = await requireAdmin();
  if (!ids.length) return { deleted: 0 };

  await prisma.$transaction(async (tx: any) => {
    await tx.influencerPost.deleteMany({ where: { influencerId: { in: ids } } });
    await tx.influencerReel.deleteMany({ where: { influencerId: { in: ids } } });
    await tx.influencerContentAnalytics.deleteMany({ where: { influencerId: { in: ids } } });
    await tx.campaignInfluencer.deleteMany({ where: { influencerId: { in: ids } } });
    await tx.event.deleteMany({ where: { influencerId: { in: ids } } });
    await tx.file.deleteMany({ where: { influencerId: { in: ids } } });
    await tx.influencer.deleteMany({ where: { id: { in: ids } } });

    await tx.auditLog.create({
      data: {
        action: "INFLUENCER_DELETED",
        entityType: "INFLUENCER",
        entityId: "bulk",
        adminId: user.id,
        details: `Bulk deleted ${ids.length} influencer(s)`,
      },
    });
  }, { maxWait: 10000, timeout: 20000 });

  revalidatePath("/influencers/pipeline");
  revalidatePath("/influencers");
  return { deleted: ids.length };
}

export async function bulkAddToCampaignAction(ids: string[], campaignId: string) {
  const user = await requireAuth();
  if (!ids.length) return { added: 0, skipped: 0 };

  const existing = await prisma.campaignInfluencer.findMany({
    where: { campaignId, influencerId: { in: ids } },
    select: { influencerId: true },
  });
  const existingIds = new Set(existing.map((e: any) => e.influencerId));
  const toAdd = ids.filter((id) => !existingIds.has(id));

  if (toAdd.length) {
    await prisma.campaignInfluencer.createMany({
      data: toAdd.map((influencerId) => ({ campaignId, influencerId, status: "INVITED" })),
    });

    await prisma.campaignActivity.create({
      data: {
        campaignId,
        type: "INFLUENCER_ASSIGNED",
        details: `Bulk assigned ${toAdd.length} influencer(s) from Pipeline`,
        userId: user.id,
      },
    });
  }

  revalidatePath("/influencers/pipeline");
  revalidatePath(`/campaigns/${campaignId}`);
  return { added: toAdd.length, skipped: ids.length - toAdd.length };
}

// ─── KPI Dashboard (9 metrics, 8-week sparklines + growth) ────────
function weekBucketIndex(date: Date, now: Date, weeks: number) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksAgo = Math.floor((now.getTime() - date.getTime()) / msPerWeek);
  return weeks - 1 - weeksAgo;
}

function buildWeeklySeries(rows: { date: Date; value: number }[], weeks: number, now: Date): number[] {
  const buckets = new Array(weeks).fill(0);
  for (const row of rows) {
    const idx = weekBucketIndex(row.date, now, weeks);
    if (idx >= 0 && idx < weeks) buckets[idx] += row.value;
  }
  return buckets;
}

function buildCumulativeSeries(rows: { date: Date; value: number }[], weeks: number, now: Date): number[] {
  const weekly = buildWeeklySeries(rows, weeks, now);
  let running = 0;
  return weekly.map((v) => (running += v));
}

function growthPct(series: number[]): number | null {
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

const WEEKS = 8;

export async function getPipelineKpisAction() {
  await requireAuth();
  const now = new Date();

  const influencers = await prisma.influencer.findMany({
    select: {
      id: true,
      status: true,
      engagementRate: true,
      followers: true,
      createdAt: true,
      lastContactDate: true,
      reelRate: true,
      storyRate: true,
      negotiationTerms: true,
      creatorIntelligence: { select: { intelligenceScore: true } },
    },
  });

  const activeAssignments = await prisma.campaignInfluencer.findMany({
    where: { campaign: { status: "ACTIVE" } },
    select: { campaignId: true, createdAt: true },
  });

  const byStatus = (s: string) => influencers.filter((i: any) => i.status === s);
  const readyToSign = influencers.filter(
    (i: any) => i.status === "NEGOTIATING" && (i.reelRate || i.storyRate) && i.negotiationTerms
  );
  const contactedOrFurther = influencers.filter((i: any) => i.status !== "NEW_LEAD");
  const repliedOrFurther = influencers.filter((i: any) =>
    ["REPLIED", "NEGOTIATING", "ACTIVE", "ONBOARDED"].includes(i.status)
  );
  const engagementValues = influencers.filter((i: any) => i.engagementRate != null).map((i: any) => i.engagementRate as number);
  const avgEngagement = engagementValues.length ? engagementValues.reduce((a: number, b: number) => a + b, 0) / engagementValues.length : 0;

  const highPriorityFollowUps = influencers.filter((i: any) => {
    if (["ACTIVE", "ONBOARDED", "BLACKLISTED"].includes(i.status)) return false;
    return computePriority(i).level === "HIGH";
  });

  const distinctActiveCampaigns = new Set(activeAssignments.map((a: any) => a.campaignId));

  const totalSeries = buildCumulativeSeries(influencers.map((i: any) => ({ date: i.createdAt, value: 1 })), WEEKS, now);
  const newLeadSeries = buildWeeklySeries(byStatus("NEW_LEAD").map((i: any) => ({ date: i.createdAt, value: 1 })), WEEKS, now);
  const contactedSeries = buildWeeklySeries(byStatus("CONTACTED").map((i: any) => ({ date: i.createdAt, value: 1 })), WEEKS, now);
  const negotiatingSeries = buildWeeklySeries(byStatus("NEGOTIATING").map((i: any) => ({ date: i.createdAt, value: 1 })), WEEKS, now);
  const readySeries = buildWeeklySeries(readyToSign.map((i: any) => ({ date: i.createdAt, value: 1 })), WEEKS, now);
  const activeCampaignSeries = buildCumulativeSeries(
    activeAssignments
      .filter((a: any) => distinctActiveCampaigns.has(a.campaignId))
      .map((a: any) => ({ date: a.createdAt, value: 1 })),
    WEEKS,
    now
  );
  const responseRateSeries = (() => {
    const sortedAll = [...influencers].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const series: number[] = [];
    for (let w = WEEKS - 1; w >= 0; w--) {
      const cutoff = new Date(now.getTime() - w * weekMs);
      const upToNow = sortedAll.filter((i: any) => new Date(i.createdAt) <= cutoff);
      const contacted = upToNow.filter((i: any) => i.status !== "NEW_LEAD").length;
      const replied = upToNow.filter((i: any) => ["REPLIED", "NEGOTIATING", "ACTIVE", "ONBOARDED"].includes(i.status)).length;
      series.push(contacted > 0 ? Math.round((replied / contacted) * 100) : 0);
    }
    return series;
  })();
  const engagementSeries = buildWeeklySeries(
    influencers.filter((i: any) => i.engagementRate != null).map((i: any) => ({ date: i.createdAt, value: i.engagementRate })),
    WEEKS,
    now
  ).map((sum, idx) => {
    const countInBucket = influencers.filter((i: any) => i.engagementRate != null && weekBucketIndex(new Date(i.createdAt), now, WEEKS) === idx).length;
    return countInBucket > 0 ? Math.round((sum / countInBucket) * 100) / 100 : 0;
  });
  const highPrioritySeries = buildWeeklySeries(highPriorityFollowUps.map((i: any) => ({ date: i.createdAt, value: 1 })), WEEKS, now);

  return {
    metrics: {
      totalCreators: influencers.length,
      newLeads: byStatus("NEW_LEAD").length,
      contacted: byStatus("CONTACTED").length,
      negotiating: byStatus("NEGOTIATING").length,
      readyToSign: readyToSign.length,
      activeCampaigns: distinctActiveCampaigns.size,
      responseRate: contactedOrFurther.length > 0 ? Math.round((repliedOrFurther.length / contactedOrFurther.length) * 100) : 0,
      averageEngagement: Math.round(avgEngagement * 100) / 100,
      highPriorityFollowUps: highPriorityFollowUps.length,
    },
    series: {
      totalCreators: totalSeries,
      newLeads: newLeadSeries,
      contacted: contactedSeries,
      negotiating: negotiatingSeries,
      readyToSign: readySeries,
      activeCampaigns: activeCampaignSeries,
      responseRate: responseRateSeries,
      averageEngagement: engagementSeries,
      highPriorityFollowUps: highPrioritySeries,
    },
    growth: {
      totalCreators: growthPct(totalSeries),
      newLeads: growthPct(newLeadSeries),
      contacted: growthPct(contactedSeries),
      negotiating: growthPct(negotiatingSeries),
      readyToSign: growthPct(readySeries),
      activeCampaigns: growthPct(activeCampaignSeries),
      responseRate: growthPct(responseRateSeries),
      averageEngagement: growthPct(engagementSeries),
      highPriorityFollowUps: growthPct(highPrioritySeries),
    },
  };
}

// ─── Distinct categories (for filter chips / advanced filters) ────
export async function getPipelineCategoriesAction() {
  await requireAuth();
  const rows = await prisma.influencer.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });
  return rows.map((r: any) => r.category).filter(Boolean).sort();
}

// ─── AI Pipeline Insights (deterministic, rule-based) ──────────────
export async function getPipelineInsightsAction() {
  await requireAuth();
  const service = new PipelineInsightsService();
  return service.generate();
}

// ─── CSV export (all matching rows, not just current page) ────────
export async function exportInfluencersAction(filters: PipelineFilters) {
  await requireAuth();
  const where = buildWhere(filters);

  const rows = await prisma.influencer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10_000,
    select: {
      influencerName: true,
      instagramHandle: true,
      category: true,
      followers: true,
      engagementRate: true,
      status: true,
      email: true,
      phoneNumber: true,
      location: true,
      lastContactDate: true,
      createdAt: true,
    },
  });

  const headers = ["Name", "Handle", "Category", "Followers", "Engagement Rate", "Status", "Email", "Phone", "Location", "Last Contact", "Created At"];
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r: any) =>
      [
        r.influencerName,
        r.instagramHandle,
        r.category,
        r.followers,
        r.engagementRate,
        r.status,
        r.email,
        r.phoneNumber,
        r.location,
        r.lastContactDate ? new Date(r.lastContactDate).toISOString() : "",
        new Date(r.createdAt).toISOString(),
      ]
        .map(escape)
        .join(",")
    ),
  ];

  return lines.join("\n");
}
