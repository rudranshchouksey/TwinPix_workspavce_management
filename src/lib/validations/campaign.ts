import { z } from "zod";

export const campaignSchema = z.object({
  name: z.string().min(2, "Campaign name is required").max(100),
  clientId: z.string().min(1, "Client is required"),
  budget: z.coerce.number().min(0),
  deliverables: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["PLANNING", "ACTIVE", "REVIEW", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional(),
});

export type CampaignInput = z.infer<typeof campaignSchema>;

export const updateCampaignSchema = campaignSchema.partial();
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const assignInfluencerSchema = z.object({
  influencerId: z.string().min(1, "Influencer is required"),
  fee: z.coerce.number().min(0).default(0),
  deliverables: z.string().optional(),
  status: z.string().default("PENDING"),
});

export type AssignInfluencerInput = z.infer<typeof assignInfluencerSchema>;

export const assignTeamMemberSchema = z.object({
  userId: z.string().min(1, "Team member is required"),
  role: z.string().default("MEMBER"),
});

export type AssignTeamMemberInput = z.infer<typeof assignTeamMemberSchema>;
