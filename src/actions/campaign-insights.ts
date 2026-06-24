"use server";

import { unstable_cache } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { CampaignInsightsService } from "@/services/campaigns/campaign-insights.service";

const getCachedInsights = unstable_cache(
  async () => new CampaignInsightsService().generate(),
  ["campaign-insights"],
  { revalidate: 60, tags: ["campaigns"] }
);

export async function getCampaignInsightsAction() {
  await requireAuth();
  return getCachedInsights();
}
