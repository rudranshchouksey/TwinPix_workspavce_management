"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { WorkflowEngine } from "@/services/workflow.engine";
import {
  CampaignInput,
  campaignSchema,
  UpdateCampaignInput,
  updateCampaignSchema,
  AssignInfluencerInput,
  assignInfluencerSchema,
  AssignTeamMemberInput,
  assignTeamMemberSchema
} from "@/lib/validations/campaign";

// Helper to log activities
async function logActivity(campaignId: string, type: string, details: string, metadata?: object) {
  const user = await requireAuth();
  await db.campaignActivity.create({
    data: {
      campaignId,
      type,
      details,
      userId: user.id,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// Helper to log audit (Fire and forget to not block request)
function logAudit(action: string, entityId: string, details?: string) {
  requireAuth().then((user) => {
    db.auditLog.create({
      data: {
        action,
        entityType: "CAMPAIGN",
        entityId,
        adminId: user.id,
        details,
      },
    }).catch(console.error);
  }).catch(console.error);
}

export async function getCampaignsAction(params: {
  query?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
  archived?: boolean;
}) {
  await requireAuth();

  const { query, status, clientId, page = 1, limit = 50, archived = false } = params;
  const skip = (page - 1) * limit;

  const where: any = { isArchived: archived };

  if (query) {
    where.name = { contains: query, mode: "insensitive" };
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (clientId) {
    where.clientId = clientId;
  }

  const [campaigns, total] = await Promise.all([
    db.campaign.findMany({
      where,
      include: {
        client: {
          select: { id: true, companyName: true, brandName: true },
        },
        influencers: {
          include: {
            influencer: {
              select: { id: true, influencerName: true, instagramHandle: true, profileImage: true, followers: true },
            },
          },
        },
        _count: { select: { tasks: true } },
        teamMembers: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.campaign.count({ where }),
  ]);

  return {
    campaigns,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Lightweight name-only lookup for page titles/breadcrumbs (avoids the heavy includes below)
export async function getCampaignNameAction(id: string) {
  await requireAuth();
  return db.campaign.findUnique({
    where: { id },
    select: { name: true },
  });
}

export async function getCampaignByIdAction(id: string) {
  await requireAuth();

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      client: true,
      influencers: {
        include: {
          influencer: true,
        },
      },
      teamMembers: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true, jobTitle: true },
          },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  return campaign;
}

export async function createCampaignAction(input: CampaignInput) {
  const user = await requireAuth();
  const validatedData = campaignSchema.parse(input);

  const campaign = await db.campaign.create({
    data: {
      name: validatedData.name,
      clientId: validatedData.clientId,
      budget: validatedData.budget,
      deliverables: validatedData.deliverables,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      status: validatedData.status as any,
      notes: validatedData.notes,
    },
  });

  logAudit("CAMPAIGN_CREATED", campaign.id, `Created campaign: ${campaign.name}`);
  await logActivity(campaign.id, "CAMPAIGN_CREATED", `Campaign created by ${user.name}`);
  
  await WorkflowEngine.trigger("CAMPAIGN_CREATED", { campaignId: campaign.id });

  revalidatePath("/campaigns");
  return campaign;
}

export async function updateCampaignAction(id: string, input: UpdateCampaignInput) {
  const user = await requireAuth();
  const validatedData = updateCampaignSchema.parse(input);

  const existingCampaign = await db.campaign.findUnique({ where: { id } });
  if (!existingCampaign) throw new Error("Campaign not found");

  const updateData: any = { ...validatedData };
  if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
  if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);

  const campaign = await db.campaign.update({
    where: { id },
    data: updateData,
  });

  if (existingCampaign.status !== campaign.status) {
    await logActivity(campaign.id, "STATUS_CHANGED", `Status changed from ${existingCampaign.status} to ${campaign.status}`);
    await WorkflowEngine.trigger("CAMPAIGN_STATUS", {
      campaignId: campaign.id,
      status: campaign.status
    });
    if (campaign.status === "COMPLETED") {
      await WorkflowEngine.trigger("CAMPAIGN_COMPLETED", { campaignId: campaign.id });
    }
  } else {
    await logActivity(campaign.id, "CAMPAIGN_UPDATED", `Campaign details updated by ${user.name}`);
  }

  logAudit("CAMPAIGN_UPDATED", campaign.id, `Updated campaign: ${campaign.name}`);

  revalidatePath(`/campaigns`);
  revalidatePath(`/campaigns/${id}`);
  return campaign;
}

export async function deleteCampaignAction(id: string) {
  const user = await requireAuth();

  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) throw new Error("Campaign not found");

  await db.campaign.delete({ where: { id } });

  logAudit("CAMPAIGN_DELETED", id, `Deleted campaign: ${campaign.name} by ${user.name}`);

  revalidatePath("/campaigns");
}

export async function duplicateCampaignAction(id: string) {
  const user = await requireAuth();

  const original = await db.campaign.findUnique({
    where: { id },
    include: { influencers: true },
  });
  if (!original) throw new Error("Campaign not found");

  const copy = await db.campaign.create({
    data: {
      name: `${original.name} (Copy)`,
      clientId: original.clientId,
      budget: original.budget,
      deliverables: original.deliverables,
      startDate: original.startDate,
      endDate: original.endDate,
      status: "PLANNING",
      notes: original.notes,
      projectId: original.projectId,
      influencers: {
        create: original.influencers.map((inf) => ({
          influencerId: inf.influencerId,
          fee: inf.fee,
          deliverables: inf.deliverables,
          status: "PENDING",
        })),
      },
    },
  });

  logAudit("CAMPAIGN_DUPLICATED", copy.id, `Duplicated from "${original.name}" by ${user.name}`);
  await logActivity(copy.id, "CAMPAIGN_CREATED", `Duplicated from campaign "${original.name}"`);

  revalidatePath("/campaigns");
  return copy;
}

export async function archiveCampaignAction(id: string) {
  const user = await requireAuth();

  const campaign = await db.campaign.update({
    where: { id },
    data: { isArchived: true },
  });

  logAudit("CAMPAIGN_ARCHIVED", id, `Archived campaign: ${campaign.name} by ${user.name}`);
  await logActivity(id, "CAMPAIGN_ARCHIVED", `Campaign archived by ${user.name}`);

  revalidatePath("/campaigns");
  return campaign;
}

export async function unarchiveCampaignAction(id: string) {
  const user = await requireAuth();

  const campaign = await db.campaign.update({
    where: { id },
    data: { isArchived: false },
  });

  logAudit("CAMPAIGN_UNARCHIVED", id, `Unarchived campaign: ${campaign.name} by ${user.name}`);
  await logActivity(id, "CAMPAIGN_UNARCHIVED", `Campaign restored from archive by ${user.name}`);

  revalidatePath("/campaigns");
  return campaign;
}

export async function assignInfluencerAction(campaignId: string, input: AssignInfluencerInput) {
  const user = await requireAuth();
  const validatedData = assignInfluencerSchema.parse(input);

  const assignment = await db.campaignInfluencer.create({
    data: {
      campaignId,
      influencerId: validatedData.influencerId,
      fee: validatedData.fee,
      deliverables: validatedData.deliverables,
      status: validatedData.status,
    },
    include: {
      influencer: true,
    }
  });

  await logActivity(campaignId, "INFLUENCER_ASSIGNED", `Assigned influencer: @${assignment.influencer.instagramHandle}`);
  
  revalidatePath(`/campaigns`);
  revalidatePath(`/campaigns/${campaignId}`);
  return assignment;
}

export async function removeInfluencerAction(campaignId: string, influencerId: string) {
  const user = await requireAuth();

  const assignment = await db.campaignInfluencer.findUnique({
    where: {
      campaignId_influencerId: {
        campaignId,
        influencerId,
      }
    },
    include: {
      influencer: true,
    }
  });

  if (!assignment) throw new Error("Assignment not found");

  await db.campaignInfluencer.delete({
    where: { id: assignment.id }
  });

  await logActivity(campaignId, "INFLUENCER_REMOVED", `Removed influencer: @${assignment.influencer.instagramHandle}`);
  
  revalidatePath(`/campaigns`);
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function assignTeamMemberAction(campaignId: string, input: AssignTeamMemberInput) {
  const user = await requireAuth();
  const validatedData = assignTeamMemberSchema.parse(input);

  const assignment = await db.campaignTeamMember.create({
    data: {
      campaignId,
      userId: validatedData.userId,
      role: validatedData.role,
    },
    include: {
      user: true,
    }
  });

  await logActivity(campaignId, "TEAM_MEMBER_ASSIGNED", `Assigned team member: ${assignment.user.name}`);
  
  revalidatePath(`/campaigns`);
  revalidatePath(`/campaigns/${campaignId}`);
  return assignment;
}

export async function removeTeamMemberAction(campaignId: string, userId: string) {
  const user = await requireAuth();

  const assignment = await db.campaignTeamMember.findUnique({
    where: {
      campaignId_userId: {
        campaignId,
        userId,
      }
    },
    include: {
      user: true,
    }
  });

  if (!assignment) throw new Error("Assignment not found");

  await db.campaignTeamMember.delete({
    where: { id: assignment.id }
  });

  await logActivity(campaignId, "TEAM_MEMBER_REMOVED", `Removed team member: ${assignment.user.name}`);
  
  revalidatePath(`/campaigns`);
  revalidatePath(`/campaigns/${campaignId}`);
}

import { unstable_cache } from "next/cache";

const getCachedCampaignStats = unstable_cache(
  async () => {
    const [total, active, review, planning, budgetAggregate] = await Promise.all([
      db.campaign.count(),
      db.campaign.count({ where: { status: "ACTIVE" } }),
      db.campaign.count({ where: { status: "REVIEW" } }),
      db.campaign.count({ where: { status: "PLANNING" } }),
      db.campaign.aggregate({
        where: { status: "ACTIVE" },
        _sum: { budget: true },
      }),
    ]);

    return {
      total,
      active,
      review,
      planning,
      totalActiveBudget: budgetAggregate._sum.budget || 0,
    };
  },
  ["campaign-stats"],
  { revalidate: 60, tags: ["campaigns"] }
);

export async function getCampaignStatsAction() {
  await requireAuth();
  return getCachedCampaignStats();
}

// ─── KPI Dashboard (rich metrics + 8-week sparklines + growth) ──────────

function weekBucketKey(date: Date, now: Date) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksAgo = Math.floor((now.getTime() - date.getTime()) / msPerWeek);
  return weeksAgo;
}

function buildWeeklySeries(
  rows: { date: Date; value: number }[],
  weeks: number,
  now: Date
): number[] {
  const buckets = new Array(weeks).fill(0);
  for (const row of rows) {
    const weeksAgo = weekBucketKey(row.date, now);
    const idx = weeks - 1 - weeksAgo; // oldest week first, current week last
    if (idx >= 0 && idx < weeks) buckets[idx] += row.value;
  }
  return buckets;
}

function growthPct(series: number[]): number | null {
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

const getCachedCampaignKpis = unstable_cache(
  async () => {
    const WEEKS = 8;
    const now = new Date();

    const [campaigns, assignments] = await Promise.all([
      db.campaign.findMany({
        where: { isArchived: false },
        select: { id: true, status: true, budget: true, createdAt: true, startDate: true, endDate: true, updatedAt: true },
      }),
      db.campaignInfluencer.findMany({
        where: { campaign: { isArchived: false } },
        select: {
          id: true,
          createdAt: true,
          influencerId: true,
          status: true,
          campaign: { select: { status: true } },
          influencer: { select: { followers: true } },
        },
      }),
    ]);

    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === "ACTIVE").length;
    const completed = campaigns.filter((c) => c.status === "COMPLETED").length;
    const totalBudget = campaigns.filter((c) => c.status !== "CANCELLED").reduce((sum, c) => sum + c.budget, 0);

    const distinctInfluencerIds = new Set(assignments.map((a) => a.influencerId));
    const totalInfluencers = distinctInfluencerIds.size;

    const seenForReach = new Set<string>();
    let expectedReach = 0;
    for (const a of assignments) {
      if (seenForReach.has(a.influencerId)) continue;
      seenForReach.add(a.influencerId);
      expectedReach += a.influencer.followers || 0;
    }

    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = campaigns.filter(
      (c) => c.endDate && c.endDate >= now && c.endDate <= sevenDaysOut && ["PLANNING", "ACTIVE", "REVIEW"].includes(c.status)
    ).length;

    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const totalSeries = buildWeeklySeries(campaigns.map((c) => ({ date: c.createdAt, value: 1 })), WEEKS, now);
    const activeSeries = buildWeeklySeries(
      campaigns.filter((c) => c.startDate).map((c) => ({ date: c.startDate as Date, value: c.status === "ACTIVE" ? 1 : 0 })),
      WEEKS,
      now
    );
    const completedSeries = buildWeeklySeries(
      campaigns.filter((c) => c.status === "COMPLETED").map((c) => ({ date: c.updatedAt, value: 1 })),
      WEEKS,
      now
    );
    const budgetSeries = buildWeeklySeries(
      campaigns.filter((c) => c.status !== "CANCELLED").map((c) => ({ date: c.createdAt, value: c.budget })),
      WEEKS,
      now
    );
    const reachSeries = buildWeeklySeries(
      assignments.map((a) => ({ date: a.createdAt, value: a.influencer.followers || 0 })),
      WEEKS,
      now
    );
    const influencerSeries = buildWeeklySeries(
      assignments.map((a) => ({ date: a.createdAt, value: 1 })),
      WEEKS,
      now
    );

    const deadlineSeries = (() => {
      const days = 7;
      const buckets = new Array(days).fill(0);
      for (const c of campaigns) {
        if (!c.endDate || c.endDate < now) continue;
        const daysOut = Math.floor((c.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (daysOut >= 0 && daysOut < days) buckets[daysOut] += 1;
      }
      return buckets;
    })();

    const successSeries = (() => {
      const sorted = [...campaigns].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const series: number[] = [];
      for (let w = WEEKS - 1; w >= 0; w--) {
        const cutoff = new Date(now.getTime() - w * weekMs);
        const upToNow = sorted.filter((c) => c.createdAt <= cutoff);
        const completedUpToNow = upToNow.filter((c) => c.status === "COMPLETED").length;
        series.push(upToNow.length > 0 ? Math.round((completedUpToNow / upToNow.length) * 100) : 0);
      }
      return series;
    })();

    return {
      total,
      active,
      completed,
      totalBudget,
      expectedReach,
      totalInfluencers,
      upcomingDeadlines,
      successRate,
      series: {
        total: totalSeries,
        active: activeSeries,
        completed: completedSeries,
        budget: budgetSeries,
        reach: reachSeries,
        influencers: influencerSeries,
        deadlines: deadlineSeries,
        successRate: successSeries,
      },
      growth: {
        total: growthPct(totalSeries),
        active: growthPct(activeSeries),
        completed: growthPct(completedSeries),
        budget: growthPct(budgetSeries),
        reach: growthPct(reachSeries),
        influencers: growthPct(influencerSeries),
        successRate: growthPct(successSeries),
      },
    };
  },
  ["campaign-kpis"],
  { revalidate: 60, tags: ["campaigns"] }
);

export async function getCampaignKpisAction() {
  await requireAuth();
  return getCachedCampaignKpis();
}

// ─── CSV Import ───────────────────────────────────────────────────────

export async function getRecentCampaignActivityAction(limit: number = 8) {
  await requireAuth();
  return db.campaignActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      campaign: { select: { id: true, name: true } },
    },
  });
}

export async function importCampaignsAction(rows: Record<string, string>[]) {
  const user = await requireAuth();

  const clients = await db.client.findMany({ select: { id: true, companyName: true } });
  const clientByName = new Map(clients.map((c) => [c.companyName.trim().toLowerCase(), c.id]));

  let created = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name?.trim();
    const clientName = row.clientName?.trim() || row.client?.trim();

    if (!name) {
      errors.push({ row: i + 1, reason: "Missing campaign name" });
      continue;
    }

    const clientId = clientName ? clientByName.get(clientName.toLowerCase()) : undefined;
    if (!clientId) {
      errors.push({ row: i + 1, reason: `Client "${clientName || ""}" not found` });
      continue;
    }

    const statusRaw = row.status?.trim().toUpperCase();
    const status = ["PLANNING", "ACTIVE", "REVIEW", "COMPLETED", "CANCELLED"].includes(statusRaw)
      ? statusRaw
      : "PLANNING";

    try {
      const campaign = await db.campaign.create({
        data: {
          name,
          clientId,
          budget: row.budget ? parseFloat(row.budget) || 0 : 0,
          startDate: row.startDate ? new Date(row.startDate) : null,
          endDate: row.endDate ? new Date(row.endDate) : null,
          status: status as any,
          deliverables: row.deliverables || undefined,
          notes: row.notes || undefined,
        },
      });
      logAudit("CAMPAIGN_IMPORTED", campaign.id, `Imported campaign: ${campaign.name} by ${user.name}`);
      created++;
    } catch (err: any) {
      errors.push({ row: i + 1, reason: err.message || "Failed to create campaign" });
    }
  }

  revalidatePath("/campaigns");
  return { created, errors, total: rows.length };
}
