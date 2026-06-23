"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
const prisma = db as any;
import { requireAuth } from "@/lib/auth-utils";
import { CreatorIntelligenceService } from "@/services/ai/creator-intelligence.service";

export async function getCreatorAIInsightsAction(influencerId: string) {
  await requireAuth();
  return prisma.creatorAIInsights.findUnique({ where: { influencerId } });
}

export async function regenerateCreatorAIInsightsAction(influencerId: string) {
  await requireAuth();

  try {
    const service = new CreatorIntelligenceService();
    const insights = await service.generateInsights(influencerId);

    revalidatePath(`/influencers/${influencerId}`);

    return { success: true, insights };
  } catch (error: any) {
    console.error("[regenerateCreatorAIInsightsAction] Failed:", error);
    return {
      success: false,
      error: error.message || "Failed to generate AI creator intelligence",
    };
  }
}
