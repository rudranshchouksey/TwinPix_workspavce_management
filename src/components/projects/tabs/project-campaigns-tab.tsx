import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import Link from "next/link";
import { FolderKanban } from "lucide-react";

export function ProjectCampaignsTab({ project }: { project: any }) {
  const campaigns = project.campaigns || [];

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-16 text-center">
        <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4">
          <FolderKanban className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No campaigns</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">This project has no campaigns yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.map((campaign: any) => (
        <Link href={`/campaigns/${campaign.id}`} key={campaign.id} className="block group">
          <PremiumCard hoverEffect="lift" className="p-5 h-full flex flex-col relative border-[rgba(0,0,0,0.08)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-brand-500)] transition-colors">{campaign.name}</h3>
            
            <div className="mt-auto pt-4 flex items-center justify-between border-t border-[rgba(0,0,0,0.05)]">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                campaign.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                campaign.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-500' :
                'bg-amber-500/10 text-amber-500'
              }`}>
                {campaign.status}
              </span>
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                {campaign.influencers?.length || 0} Influencers
              </span>
            </div>
          </PremiumCard>
        </Link>
      ))}
    </div>
  );
}
