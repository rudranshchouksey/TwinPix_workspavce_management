"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { KPICards } from "./kpi-cards";
import { TopInfluencers } from "./top-influencers";

const RevenueChart = dynamic(() => import("./revenue-chart").then(mod => mod.RevenueChart), { 
  ssr: false,
  loading: () => <div className="col-span-4 lg:col-span-3 min-h-[400px] rounded-xl bg-stone-100 animate-pulse border" />
});

const CampaignChart = dynamic(() => import("./campaign-chart").then(mod => mod.CampaignChart), { 
  ssr: false,
  loading: () => <div className="col-span-4 lg:col-span-2 min-h-[400px] rounded-xl bg-stone-100 animate-pulse border" />
});
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

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
    // In a real app, this would trigger a CSV/PDF generation endpoint
    setTimeout(() => toast.success("Export complete. Download started."), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics and studio growth.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </motion.div>
      </div>

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
        
        {/* Placeholder for future growth / Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-4 lg:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm p-6"
        >
          <div className="flex flex-col space-y-1.5 mb-6">
            <h3 className="font-semibold leading-none tracking-tight">Growth Insights</h3>
            <p className="text-sm text-muted-foreground">AI-driven studio analysis</p>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <h4 className="font-medium text-sm text-primary mb-1">Strong Revenue Trend</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your revenue has grown by 12.5% this month. The "Summer Campaign" was a major contributor to this spike. Consider engaging the same influencers for upcoming holidays.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <h4 className="font-medium text-sm text-emerald-500 mb-1">High Productivity</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Team task completion rate is at {kpiData.productivity}%. Keep up the good work utilizing the Kanban board for tracking.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
