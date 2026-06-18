"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, Activity, Briefcase, PlayCircle } from "lucide-react";

interface InfluencerMetricsProps {
  influencer: any;
}

export function InfluencerMetrics({ influencer }: InfluencerMetricsProps) {
  // Mock historical data since we only have point-in-time data in the current schema
  const mockHistoricalData = [
    { month: "Jan", engagement: (influencer.engagementRate || 2) * 0.8 },
    { month: "Feb", engagement: (influencer.engagementRate || 2) * 0.85 },
    { month: "Mar", engagement: (influencer.engagementRate || 2) * 0.9 },
    { month: "Apr", engagement: (influencer.engagementRate || 2) * 0.95 },
    { month: "May", engagement: (influencer.engagementRate || 2) * 1.05 },
    { month: "Jun", engagement: (influencer.engagementRate || 2) },
  ];

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return "—";
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-12 h-12 text-[var(--color-brand-600)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
            Followers
          </p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {formatNumber(influencer.followers)}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-12 h-12 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
            Engagement Rate
          </p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {influencer.engagementRate ? `${influencer.engagementRate.toFixed(2)}%` : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Briefcase className="w-12 h-12 text-rose-600" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
            Campaigns
          </p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {influencer.campaignCount || 0}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PlayCircle className="w-12 h-12 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
            Posts
          </p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {formatNumber(influencer.posts)}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">
          Estimated Engagement Trend
        </h3>
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="99%" height="100%">
            <LineChart
              data={mockHistoricalData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="var(--color-text-muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="var(--color-text-muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-950)",
                  borderColor: "var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-text-primary)",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                }}
                itemStyle={{ color: "var(--color-brand-600)", fontWeight: "bold" }}
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="var(--color-brand-600)"
                strokeWidth={3}
                dot={{ r: 4, fill: "white", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "var(--color-brand-500)", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
