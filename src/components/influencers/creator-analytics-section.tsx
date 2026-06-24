"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Users2 } from "lucide-react";
import { computeCreatorKpis } from "./creator-metric-utils";

const chartTooltipStyle = {
  backgroundColor: "white",
  borderColor: "var(--color-border)",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: 600,
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
};

function ChartCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Icon className="w-4 h-4 text-[var(--color-brand-500)]" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function CreatorAnalyticsSection({ influencer }: { influencer: any }) {
  const kpis = computeCreatorKpis(influencer);
  const hasSnapshots = (influencer.metricSnapshots || []).length >= 2;

  const engagementData = kpis.weekLabels.map((label, i) => ({ label, value: kpis.series.engagementRate[i] }));
  const frequencyData = kpis.weekLabels.map((label, i) => ({ label, value: kpis.series.totalPosts[i] }));
  const growthData = kpis.weekLabels.map((label, i) => ({ label, value: kpis.series.followers[i] }));

  const contentMix = [
    { name: "Feed Posts", value: kpis.postsCount },
    { name: "Reels", value: kpis.reelsCount },
  ].filter((d) => d.value > 0);
  const MIX_COLORS = ["#6366f1", "#ec4899"];

  return (
    <div className="col-span-12 flex flex-col gap-6">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard icon={TrendingUp} title="Engagement Rate Trend (8 weeks)">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [`${v}%`, "Engagement"]} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard icon={BarChart3} title="Posting Frequency (8 weeks)">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [v, "Posts + Reels"]} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard icon={PieChartIcon} title="Content Mix">
          {contentMix.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm font-medium text-[var(--color-text-disabled)]">
              No content synced yet.
            </div>
          ) : (
            <div className="h-[220px] w-full flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie data={contentMix} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {contentMix.map((entry, i) => (
                      <Cell key={entry.name} fill={MIX_COLORS[i % MIX_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {contentMix.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MIX_COLORS[i % MIX_COLORS.length] }} />
                      <span className="text-[var(--color-text-secondary)] font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-[var(--color-text-primary)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard icon={Users2} title="Audience Growth (8 weeks)">
          {!hasSnapshots ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-center gap-1 px-4">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Not enough history yet</p>
              <p className="text-xs text-[var(--color-text-disabled)] max-w-xs">
                Audience growth charts after this creator has been synced at least twice. Run a sync to start tracking.
              </p>
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [v.toLocaleString(), "Followers"]} />
                  <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: "#0ea5e9" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
