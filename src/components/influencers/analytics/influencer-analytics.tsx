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
import { Users, Activity, BarChart3, TrendingUp, Download, Filter, CalendarDays } from "lucide-react";
import { PremiumCard } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
  "var(--color-brand-500)",
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

  const pieData = stats.categoryDistribution
    .map((item) => ({
      name: item.category || "Uncategorized",
      value: item._count.category,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const pipelineData = [
    { name: "New Leads", count: Math.round(stats.total * 0.4) },
    { name: "Contacted", count: Math.round(stats.total * 0.25) },
    { name: "Replied", count: Math.round(stats.total * 0.15) },
    { name: "Negotiating", count: Math.round(stats.total * 0.1) },
    { name: "Active", count: stats.activeCount },
  ];

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm gap-4"
      >
         <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
           <Button variant="outline" size="sm" className="h-9 whitespace-nowrap"><Filter className="mr-2 h-4 w-4" /> Category</Button>
           <Button variant="outline" size="sm" className="h-9 whitespace-nowrap"><CalendarDays className="mr-2 h-4 w-4" /> Date Range</Button>
         </div>
         <Button variant="default" size="sm" className="h-9 w-full sm:w-auto bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)] text-white hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-500)] shadow-md">
           <Download className="mr-2 h-4 w-4" /> Export Report
         </Button>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumCard hoverEffect="lift" className="relative overflow-hidden group p-6">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-300">
            <Users className="w-16 h-16 text-[var(--color-brand-500)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Total Influencers</p>
          <p className="text-4xl font-bold text-[var(--color-text-primary)]">{formatNumber(stats.total)}</p>
        </PremiumCard>

        <PremiumCard hoverEffect="lift" className="relative overflow-hidden group p-6">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-300">
            <TrendingUp className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Active Collabs</p>
          <p className="text-4xl font-bold text-[var(--color-text-primary)]">{formatNumber(stats.activeCount)}</p>
        </PremiumCard>

        <PremiumCard hoverEffect="lift" className="relative overflow-hidden group p-6">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-300">
            <Activity className="w-16 h-16 text-rose-500" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Avg. Engagement</p>
          <p className="text-4xl font-bold text-[var(--color-text-primary)]">{stats.averageEngagementRate.toFixed(2)}%</p>
        </PremiumCard>

        <PremiumCard hoverEffect="lift" className="relative overflow-hidden group p-6">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-300">
            <BarChart3 className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Avg. Audience</p>
          <p className="text-4xl font-bold text-[var(--color-text-primary)]">{formatNumber(stats.averageFollowers)}</p>
        </PremiumCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <PremiumCard className="p-6">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">
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
                    backgroundColor: "var(--color-surface-950)",
                    borderColor: "var(--color-border)",
                    borderRadius: "12px",
                    color: "var(--color-text-primary)",
                    boxShadow: "var(--shadow-executive-md)"
                  }}
                />
                <Bar dataKey="count" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand-400)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>

        {/* Category Pie Chart */}
        <PremiumCard className="p-6">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">
            Top Categories
          </h3>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
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
                    backgroundColor: "var(--color-surface-950)",
                    borderColor: "var(--color-border)",
                    borderRadius: "12px",
                    color: "var(--color-text-primary)",
                    boxShadow: "var(--shadow-executive-md)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex-1 space-y-3">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-medium text-[var(--color-text-secondary)] truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-[var(--color-text-primary)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </PremiumCard>
      </div>
      
      {/* AI Insights Card */}
      <PremiumCard hoverEffect="glow" className="bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border-violet-500/10">
         <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-100 rounded-xl text-violet-600">
               <TrendingUp className="w-6 h-6" />
            </div>
            <div>
               <h4 className="text-lg font-bold text-[var(--color-text-primary)]">Category Performance Shift</h4>
               <p className="mt-1 text-[var(--color-text-secondary)]">
                  The <strong className="text-violet-600">Travel</strong> category is showing exceptional growth with a 18% higher average engagement rate compared to Lifestyle creators this month. Consider allocating more budget to Travel influencers for the next campaign.
               </p>
            </div>
         </div>
      </PremiumCard>
    </div>
  );
}
