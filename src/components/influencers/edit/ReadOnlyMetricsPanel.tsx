"use client";

import { Lock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface ReadOnlyMetricsPanelProps {
  influencer: any;
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ReactNode;
}) {
  const displayValue = value === null || value === undefined ? "—" : value;
  return (
    <div className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-900)] p-4 group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        <Lock className="w-3 h-3 text-[var(--color-text-disabled)] opacity-60" />
      </div>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-lg font-black text-[var(--color-text-primary)]">
          {typeof displayValue === "number"
            ? new Intl.NumberFormat("en-US", {
                notation: "compact",
                compactDisplay: "short",
                maximumFractionDigits: 1,
              }).format(displayValue)
            : displayValue}
        </span>
      </div>
    </div>
  );
}

export function ReadOnlyMetricsPanel({ influencer }: ReadOnlyMetricsPanelProps) {
  return (
    <div className="space-y-5">
      {/* Sync badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100">
          <RefreshCw className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-xs font-bold text-violet-700">
            Managed by Instagram Sync
          </span>
        </div>
        {influencer.lastSyncDate && (
          <span className="text-[10px] font-medium text-[var(--color-text-disabled)]">
            Last synced{" "}
            {new Date(influencer.lastSyncDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Profile Picture Preview */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-900)]">
        <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-violet-100 to-indigo-200 flex items-center justify-center">
          {influencer.profileImage ? (
            <Image
              src={influencer.profileImage}
              alt={influencer.influencerName || "Profile"}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-violet-600">
              {(influencer.instagramHandle || "?").substring(0, 2).toUpperCase()}
            </span>
          )}
          <div className="absolute inset-0 ring-2 ring-black/5 rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
              Profile Picture
            </p>
            <Lock className="w-3 h-3 text-[var(--color-text-disabled)]" />
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Synced from Instagram. Upload a custom image in the Basic Info tab.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard label="Followers" value={influencer.followers} />
        <MetricCard label="Following" value={influencer.following} />
        <MetricCard label="Total Posts" value={influencer.posts} />
        <MetricCard
          label="Engagement Rate"
          value={
            influencer.engagementRate != null
              ? `${influencer.engagementRate.toFixed(2)}%`
              : null
          }
        />
        <MetricCard
          label="Avg Reel Views"
          value={influencer.analytics?.avgReelViews}
        />
        <MetricCard
          label="Avg Post Likes"
          value={influencer.analytics?.avgPostLikes}
        />
      </div>

      {/* Content Preview */}
      {((influencer.recentPosts?.length > 0) || (influencer.recentReels?.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Recent Content
            </h4>
            <Lock className="w-3 h-3 text-[var(--color-text-disabled)]" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[...(influencer.recentPosts || []), ...(influencer.recentReels || [])]
              .slice(0, 6)
              .map((item: any) => (
                <div
                  key={item.id}
                  className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-stone-100 relative"
                >
                  {item.thumbnail && (
                    <Image
                      src={item.thumbnail}
                      alt="Content"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                </div>
              ))}
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--color-text-disabled)] italic">
        These metrics are automatically synced from Instagram and cannot be manually edited.
        Use the Sync button on the influencer detail page to refresh.
      </p>
    </div>
  );
}
