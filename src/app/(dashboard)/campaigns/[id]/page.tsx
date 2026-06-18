import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getCampaignByIdAction } from "@/actions/campaigns";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CampaignProfile } from "@/components/campaigns/campaign-profile";
import { CampaignAnalytics } from "@/components/campaigns/campaign-analytics";
import { FileList } from "@/components/files/file-list";

export const metadata: Metadata = {
  title: "Campaign Detail",
  description: "View and manage influencer campaign details, budget, and deliverables.",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const resolvedParams = await params;

  let campaign;
  try {
    campaign = await getCampaignByIdAction(resolvedParams.id);
    if (!campaign) notFound();
  } catch (error) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] pb-6">
        <Link 
          href="/campaigns"
          className="flex items-center text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Link>
      </div>

      <CampaignProfile campaign={campaign} />

      <div className="mt-12">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Campaign Analytics</h2>
        <CampaignAnalytics campaign={campaign} />
      </div>

      <div className="mt-12">
        <FileList entityType="CAMPAIGN" entityId={campaign.id} title="Campaign Files" />
      </div>
    </div>
  );
}
