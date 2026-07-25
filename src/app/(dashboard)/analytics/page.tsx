import { Metadata } from "next";
import { getEnterpriseAnalyticsWidgetsAction, getEnterpriseAnalyticsChartsAction } from "@/actions/analytics";
import AnalyticsClient from "./analytics-client";

export const metadata: Metadata = {
  title: "Enterprise Analytics",
  description: "View powerful enterprise insights and performance metrics for your studio.",
};

export default async function AnalyticsPage() {
  const [widgetsResult, chartsResult] = await Promise.all([
    getEnterpriseAnalyticsWidgetsAction(),
    getEnterpriseAnalyticsChartsAction()
  ]);

  if (!widgetsResult.success || !chartsResult.success) {
    return <div className="p-8 text-red-500">Failed to load analytics data.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AnalyticsClient 
        widgets={widgetsResult.data} 
        charts={chartsResult.data} 
      />
    </div>
  );
}
