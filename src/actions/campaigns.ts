"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
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
}) {
  await requireAuth();

  const { query, status, clientId, page = 1, limit = 50 } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

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
              select: { id: true, influencerName: true, instagramHandle: true, profileImage: true },
            },
          },
        },
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
