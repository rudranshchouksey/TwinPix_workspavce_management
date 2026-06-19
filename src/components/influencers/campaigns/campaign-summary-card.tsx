"use client";

import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface CampaignSummaryCardProps {
  campaigns: any[]; // Array of CampaignInfluencer relations with included Campaign
}

export function CampaignSummaryCard({ campaigns }: CampaignSummaryCardProps) {
  // Calculate KPIs
  const totalCampaigns = campaigns.length;
  const activeStatuses = ["ACTIVE", "IN_PROGRESS", "NEGOTIATING", "CONTENT_PENDING", "CONTENT_SUBMITTED", "APPROVED"];
  const activeCampaigns = campaigns.filter(c => activeStatuses.includes(c.status) || activeStatuses.includes(c.campaign.status)).length;
  const completedCampaigns = campaigns.filter(c => c.status === "COMPLETED" || c.status === "PAID" || c.campaign.status === "COMPLETED").length;
  
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.fee || 0), 0);
  const averageFee = totalCampaigns > 0 ? totalRevenue / totalCampaigns : 0;
  
  // Find last campaign date based on createdAt of assignment or campaign start date
  const sortedCampaigns = [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const lastCampaignDate = sortedCampaigns.length > 0 ? new Date(sortedCampaigns[0].createdAt) : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const metrics = [
    {
      label: "Total Campaigns",
      value: totalCampaigns.toString(),
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Campaigns",
      value: activeCampaigns.toString(),
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Completed",
      value: completedCampaigns.toString(),
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Avg. Fee",
      value: formatCurrency(averageFee),
      icon: DollarSign,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Last Campaign",
      value: lastCampaignDate ? format(lastCampaignDate, "MMM d, yyyy") : "Never",
      icon: Calendar,
      color: "text-stone-600",
      bg: "bg-stone-100",
    },
  ];

  if (totalCampaigns === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {metrics.map((metric, i) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-[var(--color-border)] p-4 shadow-sm flex flex-col justify-center"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${metric.bg}`}>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              <span className="text-xs font-semibold text-[var(--color-text-muted)] tracking-tight">
                {metric.label}
              </span>
            </div>
            <div className="text-2xl font-black text-[var(--color-text-primary)]">
              {metric.value}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
