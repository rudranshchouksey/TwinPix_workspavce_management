import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

export function ProjectInfluencersTab({ project }: { project: any }) {
  // Aggregate unique influencers from campaigns
  const influencersMap = new Map();
  
  (project.campaigns || []).forEach((campaign: any) => {
    (campaign.influencers || []).forEach((ci: any) => {
      if (ci.influencer) {
        influencersMap.set(ci.influencer.id, ci.influencer);
      }
    });
  });

  const influencers = Array.from(influencersMap.values());

  if (influencers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-16 text-center">
        <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4">
          <Users className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No influencers</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">No influencers are linked to this project's campaigns.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {influencers.map((influencer: any) => (
        <PremiumCard key={influencer.id} className="p-5 flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-[rgba(0,0,0,0.05)]">
            <AvatarImage src={influencer.profileImage || ""} />
            <AvatarFallback className="bg-[var(--color-brand-100)] text-[var(--color-brand-600)] font-semibold">
              {(influencer.influencerName || influencer.instagramHandle || "U").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate max-w-[150px]">
              {influencer.influencerName || "Unknown"}
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate max-w-[150px]">
              @{influencer.instagramHandle}
            </p>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}
