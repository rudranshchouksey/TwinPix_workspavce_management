import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getInfluencerStatsAction } from "@/actions/influencers";
import { SectionHeader } from "@/components/dashboard/section-header";
import { InfluencerAnalytics } from "@/components/influencers/analytics/influencer-analytics";

export const metadata: Metadata = {
  title: "Influencer Analytics",
  description: "Track performance metrics across all influencers in your CRM.",
};

export default async function AnalyticsPage() {
  await requireAuth();

  const stats = await getInfluencerStatsAction();

  return (
    <div className="space-y-6">
      <SectionHeader
        label="Influencer Analytics"
        description="High-level metrics and performance trends across your influencer pipeline."
      />
      
      <InfluencerAnalytics stats={stats} />
    </div>
  );
}
