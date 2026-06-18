import { Metadata } from "next";
import { getCampaignsAction, getCampaignStatsAction } from "@/actions/campaigns";
import { getClientsAction } from "@/actions/clients";
import { requireAuth } from "@/lib/auth-utils";
import { CampaignTable } from "@/components/campaigns/campaign-table";
import { CampaignKanban } from "@/components/campaigns/campaign-kanban";
import { Megaphone, LayoutList, KanbanSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/stat-card";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Manage influencer marketing campaigns and track their status.",
};

export default async function CampaignsPage() {
  await requireAuth();

  // Fetch campaigns and clients in parallel
  const [campaignsData, stats, clientsData] = await Promise.all([
    getCampaignsAction({ limit: 100 }), // Using 100 for a solid Kanban board feel
    getCampaignStatsAction(),
    getClientsAction({ limit: 500 }), // Needed for the creation dialog
  ]);

  const { campaigns } = campaignsData;
  const { clients } = clientsData;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[var(--color-brand-500)]" />
            Campaigns
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Track and manage influencer campaigns across your client portfolio.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Campaigns"
          value={stats.total.toString()}
          icon={<Megaphone className="h-5 w-5 text-white/90" />}
          accent="bg-[var(--color-brand-500)]"
          index={0}
        />
        <StatCard
          label="Active Now"
          value={stats.active.toString()}
          icon={<KanbanSquare className="h-5 w-5 text-white/90" />}
          accent="bg-emerald-500"
          index={1}
        />
        <StatCard
          label="In Review"
          value={stats.review.toString()}
          icon={<LayoutList className="h-5 w-5 text-white/90" />}
          accent="bg-amber-500"
          index={2}
        />
        <StatCard
          label="Active Budget"
          value={`$${(stats.totalActiveBudget / 1000).toFixed(1)}k`}
          icon={<Megaphone className="h-5 w-5 text-white/90" />}
          accent="bg-purple-500"
          index={3}
        />
      </div>

      {/* Main Content Area - Tabs for View modes */}
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
          <CampaignKanban initialData={campaigns} />
        </TabsContent>

        <TabsContent value="list" className="mt-0 outline-none">
          <CampaignTable data={campaigns} clients={clients} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
