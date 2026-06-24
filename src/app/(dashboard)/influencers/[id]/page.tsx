import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getInfluencerByIdAction, getInfluencerNameAction, getInfluencerActivityAction } from "@/actions/influencers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BreadcrumbLabel } from "@/components/layout/breadcrumb-label";
import { CreatorHero } from "@/components/influencers/creator-hero";
import { CreatorKpiOverview } from "@/components/influencers/creator-kpi-overview";
import { CreatorAIIntelligence } from "@/components/influencers/creator-ai-intelligence";
import { CampaignHistorySection } from "@/components/influencers/campaigns/campaign-history-section";
import { CreatorContentGallery } from "@/components/influencers/creator-content-gallery";
import { CreatorAnalyticsSection } from "@/components/influencers/creator-analytics-section";
import { CreatorCollaborationSection } from "@/components/influencers/creator-collaboration-section";
import { CreatorRightSidebar } from "@/components/influencers/creator-right-sidebar";

import { Suspense } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const influencer = await getInfluencerNameAction(id);
  const name = influencer?.influencerName || influencer?.instagramHandle;

  return {
    title: name ? `${name} | TwinPix` : "Influencer Intelligence | TwinPix",
    description: "View creator intelligence, content performance, and campaign history.",
  };
}

export default async function InfluencerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  // Check if current user has admin rights for deletion permission
  const { checkRole } = await import("@/lib/auth-utils");
  const isAdmin = await checkRole("ADMIN");

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
        <InfluencerContent id={resolvedParams.id} isAdmin={isAdmin} />
      </Suspense>
    </div>
  );
}

async function InfluencerContent({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  // Data fetch happens inside the Suspense boundary
  const rawInfluencer = await getInfluencerByIdAction(id);
  if (!rawInfluencer) {
    notFound();
  }
  const rawActivity = await getInfluencerActivityAction(id);

  // Serialize to plain JSON to prevent Next.js Client Component serialization errors with Dates
  const influencer = JSON.parse(JSON.stringify(rawInfluencer));
  const activity = JSON.parse(JSON.stringify(rawActivity));

  // Format campaigns for the new system
  const campaignAssignments = influencer.campaigns || [];

  return (
    <div className="flex flex-col gap-8">
      <BreadcrumbLabel label={influencer.influencerName || influencer.instagramHandle} />

      {/* Section 1: Hero (includes status dropdown, quick actions, sync button) */}
      <CreatorHero influencer={influencer} isAdmin={isAdmin} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content column */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          {/* Section 2: KPI Overview */}
          <CreatorKpiOverview influencer={influencer} />

          {/* Section 3: AI Creator Intelligence */}
          <CreatorAIIntelligence influencerId={influencer.id} insights={influencer.creatorIntelligence} />

          {/* Section 4: Campaign History */}
          <CampaignHistorySection
            influencerId={influencer.id}
            campaigns={campaignAssignments}
            isAdmin={isAdmin}
          />

          {/* Section 5: Content Gallery */}
          <CreatorContentGallery
            posts={influencer.recentPosts || []}
            reels={influencer.recentReels || []}
            analytics={influencer.analytics}
            influencerHandle={influencer.instagramHandle}
          />

          {/* Section 6: Analytics */}
          <CreatorAnalyticsSection influencer={influencer} />

          {/* Section 7: Internal Collaboration */}
          <CreatorCollaborationSection influencer={influencer} activity={activity} />
        </div>

        {/* Sticky right sidebar */}
        <CreatorRightSidebar influencer={influencer} activity={activity} />
      </div>
    </div>
  );
}

function InfluencerSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-70 bg-stone-100 rounded-3xl" />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-stone-100 rounded-2xl" />
          ))}
        </div>
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-stone-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
