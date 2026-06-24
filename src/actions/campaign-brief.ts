"use server";

import { requireAuth } from "@/lib/auth-utils";
import { CampaignBriefService, GenerateCampaignBriefInput } from "@/services/ai/campaign-brief.service";

export async function generateCampaignBriefAction(input: GenerateCampaignBriefInput) {
  await requireAuth();
  try {
    const brief = await new CampaignBriefService().generate(input);
    return { success: true as const, brief };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to generate campaign brief" };
  }
}
