"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

const addCampaignInfluencerSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID is required"),
  influencerId: z.string().min(1, "Influencer ID is required"),
  fee: z.number().min(0).optional(),
  deliverables: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export async function addInfluencerToCampaignAction(input: z.infer<typeof addCampaignInfluencerSchema>) {
  const user = await requireAuth();
  const validated = addCampaignInfluencerSchema.parse(input);

  // Check if relation already exists
  const existing = await db.campaignInfluencer.findUnique({
    where: {
      campaignId_influencerId: {
        campaignId: validated.campaignId,
        influencerId: validated.influencerId,
      },
    },
  });

  if (existing) {
    throw new Error("Influencer is already assigned to this campaign.");
  }

  const assignment = await db.campaignInfluencer.create({
    data: {
      campaignId: validated.campaignId,
      influencerId: validated.influencerId,
      fee: validated.fee || 0,
      deliverables: validated.deliverables,
      status: validated.status || "INVITED",
      notes: validated.notes,
    },
    include: {
      campaign: true,
      influencer: true,
    },
  });

  // Log activity in campaign
  await db.campaignActivity.create({
    data: {
      campaignId: validated.campaignId,
      type: "INFLUENCER_ASSIGNED",
      details: `Assigned influencer: @${assignment.influencer.instagramHandle} from Influencer Profile`,
      userId: user.id,
    },
  });

  revalidatePath(`/influencers/${validated.influencerId}`);
  revalidatePath(`/campaigns/${validated.campaignId}`);
  return assignment;
}

export async function removeInfluencerFromCampaignAction(campaignId: string, influencerId: string) {
  const user = await requireAuth();

  const assignment = await db.campaignInfluencer.findUnique({
    where: {
      campaignId_influencerId: { campaignId, influencerId },
    },
    include: { influencer: true },
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  await db.campaignInfluencer.delete({
    where: { id: assignment.id },
  });

  await db.campaignActivity.create({
    data: {
      campaignId,
      type: "INFLUENCER_REMOVED",
      details: `Removed influencer: @${assignment.influencer.instagramHandle}`,
      userId: user.id,
    },
  });

  revalidatePath(`/influencers/${influencerId}`);
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function updateCampaignInfluencerStatusAction(campaignId: string, influencerId: string, status: string) {
  const user = await requireAuth();

  const assignment = await db.campaignInfluencer.update({
    where: {
      campaignId_influencerId: { campaignId, influencerId },
    },
    data: { status },
    include: { influencer: true },
  });

  await db.campaignActivity.create({
    data: {
      campaignId,
      type: "STATUS_CHANGED",
      details: `Status of @${assignment.influencer.instagramHandle} changed to ${status}`,
      userId: user.id,
    },
  });

  revalidatePath(`/influencers/${influencerId}`);
  revalidatePath(`/campaigns/${campaignId}`);
  return assignment;
}
