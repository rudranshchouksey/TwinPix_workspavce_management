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
  Cell
} from "recharts";

interface CampaignAnalyticsProps {
  campaign: any;
}

export function CampaignAnalytics({ campaign }: CampaignAnalyticsProps) {
  // Mock data for analytics based on the campaign's budget or influencers
  const totalBudget = campaign.budget || 0;
  
  // Calculate how much fee is allocated to influencers vs remaining budget
  const allocatedBudget = campaign.influencers?.reduce((acc: number, curr: any) => acc + (curr.fee || 0), 0) || 0;
  const remainingBudget = Math.max(0, totalBudget - allocatedBudget);

  const budgetData = [
    { name: "Allocated to Influencers", value: allocatedBudget },
    { name: "Remaining Budget", value: remainingBudget },
  ];

  const COLORS = ["#8b5cf6", "#34d399", "#f59e0b", "#ef4444"];

  // Mock timeline data
  const timelineData = [
    { name: "Week 1", planned: 20, actual: 15 },
    { name: "Week 2", planned: 40, actual: 45 },
    { name: "Week 3", planned: 70, actual: 60 },
    { name: "Week 4", planned: 100, actual: 85 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">
          Budget Allocation
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={budgetData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {budgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface-800)',
                  borderColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '8px'
                }} 
                itemStyle={{ color: 'var(--color-text-primary)' }}
                formatter={(value: any) => `$${Number(value || 0).toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
            <span className="text-xs text-[var(--color-text-muted)]">Allocated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#34d399]" />
            <span className="text-xs text-[var(--color-text-muted)]">Remaining</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">
          Content Deliverables Progress
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(0,0,0,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface-800)',
                  borderColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="planned" name="Planned %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual %" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
