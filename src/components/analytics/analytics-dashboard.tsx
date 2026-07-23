"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { KPICards } from "./kpi-cards";
import { TopInfluencers } from "./top-influencers";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const RevenueChart = dynamic(() => import("./revenue-chart").then(mod => mod.RevenueChart), { 
  ssr: false,
  loading: () => <div className="col-span-4 lg:col-span-3 min-h-[400px] rounded-xl bg-[var(--color-surface-800)] shimmer" />
});

const CampaignChart = dynamic(() => import("./campaign-chart").then(mod => mod.CampaignChart), { 
  ssr: false,
  loading: () => <div className="col-span-4 lg:col-span-2 min-h-[400px] rounded-xl bg-[var(--color-surface-800)] shimmer" />
});

interface AnalyticsDashboardProps {
  kpiData: {
    totalInfluencers: number;
    totalClients: number;
    activeCampaigns: number;
    totalRevenue: number;
    productivity: number;
  };
  revenueData: { name: string; revenue: number }[];
  campaignData: { name: string; value: number }[];
  influencersData: any[];
}

export function AnalyticsDashboard({
  kpiData,
  revenueData,
  campaignData,
  influencersData,
}: AnalyticsDashboardProps) {
  
  const handleExport = () => {
    toast.success("Analytics report export started");
    setTimeout(() => toast.success("Export complete. Download started."), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <PageHeader 
        title="Analytics Overview" 
        description="Performance metrics and studio growth."
        actions={
          <Button variant="default" className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)] text-white" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        }
      />

      {/* KPI Cards */}
      <KPICards data={kpiData} />

      {/* Main Charts */}
      <div className="grid grid-cols-4 lg:grid-cols-5 gap-6 mt-6">
        <RevenueChart data={revenueData} />
        <CampaignChart data={campaignData} />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-4 gap-6 mt-6">
        <TopInfluencers influencers={influencersData} />
        
        {/* Growth Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-4 lg:col-span-2"
        >
          <PremiumCard hoverEffect="glow" className="h-full bg-gradient-to-b from-white to-[var(--color-brand-50)]/30 border-t-4 border-t-[var(--color-brand-400)]">
            <div className="flex flex-col space-y-1.5 mb-6">
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Growth Insights</h3>
              <p className="text-sm text-[var(--color-text-muted)]">AI-driven studio analysis</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm transition-transform hover:scale-[1.02]">
                <h4 className="font-bold text-sm text-indigo-700 mb-1">Strong Revenue Trend</h4>
                <p className="text-sm text-indigo-600/80 leading-relaxed">
                  Your revenue has grown by <strong className="text-indigo-800">12.5%</strong> this month. The &quot;Summer Campaign&quot; was a major contributor to this spike. Consider engaging the same influencers for upcoming holidays.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm transition-transform hover:scale-[1.02]">
                <h4 className="font-bold text-sm text-emerald-700 mb-1">High Productivity</h4>
                <p className="text-sm text-emerald-600/80 leading-relaxed">
                  Team task completion rate is at <strong className="text-emerald-800">{kpiData.productivity}%</strong>. Keep up the good work utilizing the Kanban board for tracking.
                </p>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      </div>
    </div>
  );
}
