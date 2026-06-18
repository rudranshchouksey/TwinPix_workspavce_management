import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { 
  getDashboardKPIsAction, 
  getRevenueChartDataAction, 
  getCampaignPerformanceAction, 
  getTopInfluencersAction 
} from "@/actions/analytics";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View powerful insights and performance metrics for your studio.",
};

export default async function AnalyticsPage() {
  await requireAuth();

  const [kpiData, revenueData, campaignData, influencersData] = await Promise.all([
    getDashboardKPIsAction(),
    getRevenueChartDataAction(),
    getCampaignPerformanceAction(),
    getTopInfluencersAction(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <AnalyticsDashboard 
        kpiData={kpiData}
        revenueData={revenueData}
        campaignData={campaignData}
        influencersData={influencersData}
      />
    </div>
  );
}
