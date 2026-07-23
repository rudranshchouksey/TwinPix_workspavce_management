"use client";

import { Activity, MessageCircle, Heart, Eye, Target } from "lucide-react";
import { InfluencerMetrics } from "./influencer-metrics";

interface AnalyticsProps {
  analytics: any;
  influencer: any;
}

export function InfluencerAnalyticsTab({ analytics, influencer }: AnalyticsProps) {
  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
        <Target className="h-10 w-10 text-[var(--color-text-muted)] mb-4" />
        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No Analytics Available</h3>
        <p className="mt-2 text-[var(--color-text-muted)] max-w-sm">
          Click the &quot;Refresh Instagram Data&quot; button to generate AI insights and fetch content performance metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-12 h-12 text-violet-600" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
            Avg Engagement Rate
          </p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {analytics.avgEngagementRate?.toFixed(2)}%
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Eye className="w-12 h-12 text-sky-600" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
            Avg Reel Views
          </p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {analytics.avgReelViews?.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Heart className="w-12 h-12 text-rose-600" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
            Avg Post Likes
          </p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {analytics.avgPostLikes?.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <MessageCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
            Avg Post Comments
          </p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {analytics.avgPostComments?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Re-using the Recharts metrics component */}
          <InfluencerMetrics influencer={influencer} />
        </div>
        
        {/* AI Insights Sidebar */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-[var(--color-brand-600)]" />
            AI Content Insights
          </h3>
          <ul className="space-y-4">
            {analytics.aiInsights?.map((insight: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-[var(--color-text-secondary)] font-medium bg-stone-50 p-3 rounded-lg border border-[var(--color-border)]">
                <span className="text-[var(--color-brand-500)] mt-0.5">•</span>
                {insight}
              </li>
            ))}
            {(!analytics.aiInsights || analytics.aiInsights.length === 0) && (
              <li className="text-[var(--color-text-muted)]">No insights available.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
