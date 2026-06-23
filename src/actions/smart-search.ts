"use server";

import { requireAuth } from "@/lib/auth-utils";
import { SmartSearchService } from "@/services/ai/smart-search.service";

export async function runSmartSearchAction(query: string) {
  await requireAuth();

  if (!query || query.trim().length === 0) {
    return { success: false, error: "Please enter a search query." };
  }

  try {
    const service = new SmartSearchService();
    const result = await service.search(query);
    return { success: true, ...result };
  } catch (error: any) {
    console.error("[runSmartSearchAction] Failed:", error);
    return {
      success: false,
      error: error.message || "Failed to run AI search",
    };
  }
}
