"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { PremiumCard } from "@/components/ui/premium-card";

interface TopInfluencersProps {
  influencers: {
    id: string;
    instagramHandle: string;
    influencerName: string;
    profileImage: string | null;
    followers: number;
    engagementRate: number;
  }[];
}

export function TopInfluencers({ influencers }: TopInfluencersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="col-span-4 lg:col-span-2"
    >
      <PremiumCard className="p-6 h-full">
        <div className="flex flex-col space-y-1.5 mb-6 border-b border-[var(--color-border)] pb-4">
          <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Top Influencers</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Highest engagement rates</p>
        </div>

        <div className="space-y-6">
          {influencers.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
              No influencers found.
            </div>
          ) : (
            influencers.map((influencer, i) => (
              <motion.div 
                key={influencer.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center group cursor-pointer"
              >
                <Avatar className="h-10 w-10 border border-[var(--color-border)] shadow-sm">
                  <AvatarImage src={influencer.profileImage || undefined} alt={influencer.instagramHandle} />
                  <AvatarFallback className="bg-[var(--color-brand-50)] text-[var(--color-brand-600)] font-bold">
                    {influencer.influencerName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="ml-4 space-y-1 flex-1">
                  <Link 
                    href={`/influencers/${influencer.id}`}
                    className="text-sm font-semibold leading-none group-hover:text-[var(--color-brand-500)] transition-colors"
                  >
                    {influencer.influencerName}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)]">@{influencer.instagramHandle}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center text-xs font-bold text-emerald-500 justify-end">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {influencer.engagementRate}%
                    </div>
                    <div className="flex items-center text-xs font-medium text-[var(--color-text-muted)] mt-1 justify-end">
                      <Users className="mr-1 h-3 w-3" />
                      {(influencer.followers / 1000).toFixed(1)}k
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </PremiumCard>
    </motion.div>
  );
}
