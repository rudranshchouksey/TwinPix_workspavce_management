import { Metadata } from "next";
import { getCampaignsAction, getCampaignKpisAction, getRecentCampaignActivityAction } from "@/actions/campaigns";
import { getCampaignInsightsAction } from "@/actions/campaign-insights";
import { getClientsAction } from "@/actions/clients";
import { requireAuth } from "@/lib/auth-utils";
import { CampaignTable } from "@/components/campaigns/campaign-table";
import { CampaignKanban } from "@/components/campaigns/campaign-kanban";
import { CampaignHero } from "@/components/campaigns/campaign-hero";
import { CampaignKpiDashboard } from "@/components/campaigns/campaign-kpi-dashboard";
import { CampaignInsightsSection } from "@/components/campaigns/campaign-insights-section";
import { CampaignSidebar } from "@/components/campaigns/campaign-sidebar";
import { LayoutList, KanbanSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Manage influencer marketing campaigns and track their status.",
};

interface CampaignsPageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function CampaignsPage({ searchParams }: CampaignsPageProps) {
  await requireAuth();
  const { q, status } = await searchParams;

  const [campaignsData, kpis, insights, clientsData, activity] = await Promise.all([
    getCampaignsAction({ query: q, status, limit: 100 }),
    getCampaignKpisAction(),
    getCampaignInsightsAction(),
    getClientsAction({ limit: 500 }),
    getRecentCampaignActivityAction(8),
  ]);

  const { campaigns } = campaignsData;
  const { clients } = clientsData;

  return (
    <div className="space-y-6">
      <CampaignHero clients={clients} />

      <CampaignKpiDashboard kpis={kpis} />

      <CampaignInsightsSection insights={insights} />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="kanban" className="w-full">
            <div className="flex items-center justify-end mb-4">
              <TabsList className="bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.08)]">
                <TabsTrigger value="kanban" className="data-[state=active]:bg-[rgba(0,0,0,0.05)] data-[state=active]:text-[var(--color-text-primary)]">
                  <KanbanSquare className="w-4 h-4 mr-2" />
                  Board
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-[rgba(0,0,0,0.05)] data-[state=active]:text-[var(--color-text-primary)]">
                  <LayoutList className="w-4 h-4 mr-2" />
                  List
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="kanban" className="mt-0 outline-none">
              <CampaignKanban initialData={campaigns} clients={clients} />
            </TabsContent>

            <TabsContent value="list" className="mt-0 outline-none">
              <CampaignTable data={campaigns} clients={clients} />
            </TabsContent>
          </Tabs>
        </div>

        <CampaignSidebar campaigns={campaigns} insights={insights} activity={activity} />
      </div>
    </div>
  );
}
