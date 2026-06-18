import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getInfluencerByIdAction } from "@/actions/influencers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CreatorHero } from "@/components/influencers/creator-hero";
import { PerformanceOverview } from "@/components/influencers/performance-overview";
import { CreatorInsights } from "@/components/influencers/creator-insights";
import { ContactInfoCard } from "@/components/influencers/contact-info-card";
import { ContentPerformance } from "@/components/influencers/content-performance";
import { InfluencerPostsGrid } from "@/components/influencers/influencer-posts-grid";
import { CampaignTimeline } from "@/components/influencers/campaign-timeline";
import { InternalNotes } from "@/components/influencers/internal-notes";
import { SyncDiagnosticsPanel } from "@/components/influencers/sync-diagnostics-panel";

import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Influencer Intelligence | TwinPix",
  description: "View creator intelligence, content performance, and campaign history.",
};

export default async function InfluencerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return (
    <div className="space-y-8 pb-20">
      {/* Top Navigation Bar - Renders instantly */}
      <div className="flex items-center justify-between pb-2">
        <Link 
          href="/influencers"
          className="flex items-center text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Influencers
        </Link>
      </div>

      <Suspense fallback={<InfluencerSkeleton />}>
        <InfluencerContent id={resolvedParams.id} />
      </Suspense>
    </div>
  );
}

async function InfluencerContent({ id }: { id: string }) {
  // Data fetch happens inside the Suspense boundary
  let influencer;
  try {
    influencer = await getInfluencerByIdAction(id);
  } catch (error) {
    notFound();
  }

  // Format campaigns
  const mappedCampaigns = influencer.campaigns?.map((ci: any) => ci.campaign) || [];

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Section 1: Hero (includes status dropdown, quick actions, sync button) */}
      <CreatorHero influencer={influencer} />

      {/* Section 2: Performance + Contact Info (side by side) */}
      <PerformanceOverview influencer={influencer} analytics={influencer.analytics} />
      <ContactInfoCard influencer={influencer} />

      {/* Section 3: Content Performance */}
      <ContentPerformance posts={influencer.recentPosts || []} reels={influencer.recentReels || []} analytics={influencer.analytics} />

      {/* Section 4: Feed Posts */}
      <InfluencerPostsGrid posts={influencer.recentPosts || []} influencerHandle={influencer.instagramHandle} />

      {/* Divider */}
      <div className="col-span-12 h-px bg-[var(--color-border)] my-8" />

      {/* Section 6: Campaign History + AI Insights + Notes */}
      <CampaignTimeline campaigns={mappedCampaigns} />
      <CreatorInsights analytics={influencer.analytics} />

      {/* Section 7: Internal Notes */}
      <InternalNotes influencerId={influencer.id} initialNotes={influencer.notes} />
      
      {/* Sync Diagnostics (Dev only inside component) */}
      <div className="col-span-12">
        <SyncDiagnosticsPanel influencer={influencer} />
      </div>
    </div>
  );
}

function InfluencerSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-8 animate-pulse">
      <div className="col-span-12 h-[280px] bg-stone-100 rounded-3xl" />
      <div className="col-span-12 md:col-span-8 h-48 bg-stone-100 rounded-2xl" />
      <div className="col-span-12 md:col-span-4 h-48 bg-stone-100 rounded-2xl" />
      <div className="col-span-12 h-64 bg-stone-100 rounded-2xl" />
    </div>
  );
}
