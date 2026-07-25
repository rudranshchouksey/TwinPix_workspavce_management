"use client";

import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp, Hash, Tag, Activity } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

export function ProjectInfluencersTab({ project }: { project: any }) {
  // Aggregate unique influencers and their related campaigns
  const influencerMap = new Map();
  
  (project.campaigns || []).forEach((campaign: any) => {
    (campaign.influencers || []).forEach((ci: any) => {
      if (ci.influencer) {
        const infId = ci.influencer.id;
        if (!influencerMap.has(infId)) {
          influencerMap.set(infId, {
            ...ci.influencer,
            campaignsAssigned: []
          });
        }
        influencerMap.get(infId).campaignsAssigned.push(campaign);
      }
    });
  });

  const influencers = Array.from(influencerMap.values());

  if (influencers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-16 text-center bg-white/50">
        <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4 shadow-sm">
          <Users className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No influencers</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-sm">
          Add campaigns to this project and assign influencers to start tracking their performance here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {influencers.map((influencer: any) => {
        // Calculate performance score from their campaigns
        const campaigns = influencer.campaignsAssigned;
        const tasks = campaigns.flatMap((c: any) => c.tasks || []);
        const completedTasks = tasks.filter((t: any) => t.status === "DONE").length;
        const performanceScore = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 100;
        
        return (
          <Link href={`/influencers/${influencer.id}`} key={influencer.id} className="block group">
            <PremiumCard hoverEffect="lift" className="p-6 h-full flex flex-col bg-white border-[rgba(0,0,0,0.08)]">
              
              {/* Header: Avatar + Info */}
              <div className="flex gap-4 items-start mb-5">
                <Avatar className="h-14 w-14 border-2 border-[var(--color-brand-100)] shadow-sm">
                  <AvatarImage src={influencer.profileImage || ""} />
                  <AvatarFallback className="bg-[var(--color-brand-50)] text-[var(--color-brand-600)] font-bold text-lg">
                    {(influencer.influencerName || influencer.instagramHandle || "U").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand-600)] transition-colors">
                      {influencer.influencerName || "Unknown"}
                    </h4>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 truncate">
                    @{influencer.instagramHandle}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    influencer.status === 'ACTIVE' || influencer.status === 'ONBOARDED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    influencer.status === 'BLACKLISTED' ? 'bg-red-50 text-red-600 border border-red-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {influencer.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Middle: Stats */}
              <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Engagement
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {influencer.engagementRate ? `${influencer.engagementRate}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1">
                    <Hash className="w-3.5 h-3.5" />
                    Category
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">
                    {influencer.category || 'Uncategorized'}
                  </div>
                </div>
              </div>

              {/* Campaigns List */}
              <div className="mb-6 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  Active in Campaigns
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {campaigns.slice(0, 3).map((camp: any) => (
                    <span key={camp.id} className="text-[11px] font-semibold px-2 py-1 rounded bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                      {camp.name}
                    </span>
                  ))}
                  {campaigns.length > 3 && (
                    <span className="text-[11px] font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600">
                      +{campaigns.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Performance */}
              <div className="mt-auto pt-4 border-t border-[rgba(0,0,0,0.06)]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Performance Score
                  </div>
                  <span className="text-sm font-bold text-gray-900">{performanceScore}</span>
                </div>
                <Progress value={performanceScore} className="h-1.5 bg-gray-100" />
              </div>

            </PremiumCard>
          </Link>
        );
      })}
    </div>
  );
}
