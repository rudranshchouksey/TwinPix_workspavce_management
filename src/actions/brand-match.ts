"use server";

import { db } from "@/lib/db";
const prisma = db as any;
import { requireAuth } from "@/lib/auth-utils";
import { BrandMatchService } from "@/services/ai/brand-match.service";

/** Read-only lookup — never calls the LLM. Returns null if no match has been computed yet. */
export async function getBrandMatchAction(campaignId: string, influencerId: string) {
  await requireAuth();
  return prisma.brandMatchAnalysis.findUnique({
    where: { campaignId_influencerId: { campaignId, influencerId } },
  });
}

/** Returns the cached match if present; only calls the LLM the first time a pair is checked. */
export async function computeBrandMatchAction(campaignId: string, influencerId: string) {
  await requireAuth();

  try {
    const service = new BrandMatchService();
    const match = await service.getOrCreateMatch(campaignId, influencerId);
    return { success: true, match };
  } catch (error: any) {
    console.error("[computeBrandMatchAction] Failed:", error);
    return {
      success: false,
      error: error.message || "Failed to compute AI brand match",
    };
  }
}

/** Forces a fresh LLM call and overwrites the cached match. */
export async function regenerateBrandMatchAction(campaignId: string, influencerId: string) {
  await requireAuth();

  try {
    const service = new BrandMatchService();
    const match = await service.regenerateMatch(campaignId, influencerId);
    return { success: true, match };
  } catch (error: any) {
    console.error("[regenerateBrandMatchAction] Failed:", error);
    return {
      success: false,
      error: error.message || "Failed to regenerate AI brand match",
    };
  }
}
