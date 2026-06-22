import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getInfluencerByIdAction, getInfluencerNameAction } from "@/actions/influencers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

import { BreadcrumbLabel } from "@/components/layout/breadcrumb-label";
import { CreatorHero } from "@/components/influencers/creator-hero";
import { PerformanceOverview } from "@/components/influencers/performance-overview";
import { CreatorInsights } from "@/components/influencers/creator-insights";
import { ContactInfoCard } from "@/components/influencers/contact-info-card";
import { ContentPerformance } from "@/components/influencers/content-performance";
import { InfluencerPostsGrid } from "@/components/influencers/influencer-posts-grid";
import { CampaignHistorySection } from "@/components/influencers/campaigns/campaign-history-section";
import { InternalNotes } from "@/components/influencers/internal-notes";
import { SyncDiagnosticsPanel } from "@/components/influencers/sync-diagnostics-panel";

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
  // Serialize to plain JSON to prevent Next.js Client Component serialization errors with Dates
  const influencer = JSON.parse(JSON.stringify(rawInfluencer));

  // Format campaigns for the new system
  const campaignAssignments = influencer.campaigns || [];

  return (
    <div className="grid grid-cols-12 gap-8">
      <BreadcrumbLabel label={influencer.influencerName || influencer.instagramHandle} />

      {/* Section 1: Hero (includes status dropdown, quick actions, sync button) */}
      <CreatorHero influencer={influencer} isAdmin={isAdmin} />

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
      <div className="col-span-12">
        <CampaignHistorySection
          influencerId={influencer.id}
          campaigns={campaignAssignments}
          isAdmin={isAdmin}
        />
      </div>

      <CreatorInsights analytics={influencer.analytics} />

      {/* Section 7: Internal Notes */}
      <InternalNotes influencerId={influencer.id} initialNotes={influencer.notes} />

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
