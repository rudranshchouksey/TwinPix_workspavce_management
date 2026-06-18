"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, Activity, BarChart3, TrendingUp } from "lucide-react";

interface InfluencerAnalyticsProps {
  stats: {
    total: number;
    activeCount: number;
    categoryDistribution: { category: string | null; _count: { category: number } }[];
    averageEngagementRate: number;
    averageFollowers: number;
  };
}

const COLORS = [
  "var(--color-brand-400)",
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export function InfluencerAnalytics({ stats }: InfluencerAnalyticsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(num);
  };

  // Process category distribution for pie chart
  const pieData = stats.categoryDistribution
    .map((item) => ({
      name: item.category || "Uncategorized",
      value: item._count.category,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Process mock pipeline data since we only have single-status DB models
  const pipelineData = [
    { name: "New Leads", count: Math.round(stats.total * 0.4) },
    { name: "Contacted", count: Math.round(stats.total * 0.25) },
    { name: "Replied", count: Math.round(stats.total * 0.15) },
    { name: "Negotiating", count: Math.round(stats.total * 0.1) },
    { name: "Active", count: stats.activeCount },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-5 glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-12 h-12 text-[var(--color-brand-400)]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Total Influencers</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{formatNumber(stats.total)}</p>
        </div>

        <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-5 glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Active Collaborations</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{formatNumber(stats.activeCount)}</p>
        </div>

        <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-5 glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-12 h-12 text-rose-400" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Avg. Engagement Rate</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.averageEngagementRate.toFixed(2)}%</p>
        </div>

        <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-5 glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 className="w-12 h-12 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Avg. Audience Size</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{formatNumber(stats.averageFollowers)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
            Pipeline Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.02)" }}
                  contentStyle={{
                    backgroundColor: "var(--color-surface-800)",
                    borderColor: "rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                    color: "var(--color-text-primary)",
                  }}
                />
                <Bar dataKey="count" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
            Top Categories
          </h3>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface-800)",
                    borderColor: "rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                    color: "var(--color-text-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex-1 space-y-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[var(--color-text-secondary)] truncate max-w-[100px]">{item.name}</span>
                  </div>
                  <span className="font-medium text-[var(--color-text-primary)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
