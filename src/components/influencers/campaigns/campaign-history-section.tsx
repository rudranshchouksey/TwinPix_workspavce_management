"use client";

import { useState } from "react";
import { CampaignSummaryCard } from "./campaign-summary-card";
import { InfluencerCampaignCard } from "./influencer-campaign-card";
import { CampaignTimelineView } from "./campaign-timeline-view";
import { AddToCampaignModal } from "./add-to-campaign-modal";
import { Button } from "@/components/ui/button";
import { Plus, ListFilter, Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface CampaignHistorySectionProps {
  influencerId: string;
  campaigns: any[]; // Array of CampaignInfluencer relations
  isAdmin?: boolean;
}

export function CampaignHistorySection({ influencerId, campaigns, isAdmin }: CampaignHistorySectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // existingCampaignIds array
  const existingCampaignIds = campaigns.map(c => c.campaignId);

  return (
    <div className="space-y-6" id="campaign-history">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Campaign History</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage and track this creator's campaign participation.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white shadow-sm font-semibold rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add To Campaign
          </Button>
        </div>
      </div>

      <CampaignSummaryCard campaigns={campaigns} />

      <Tabs defaultValue="cards" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-stone-100/80 p-1">
            <TabsTrigger value="cards" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 flex items-center gap-2">
              <ListFilter className="w-3.5 h-3.5" /> Card View
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5" /> Timeline View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cards" className="mt-0 outline-none">
          {campaigns.length === 0 ? (
            <div className="text-center py-16 bg-stone-50 border border-dashed rounded-2xl border-[var(--color-border)]">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <ListFilter className="w-6 h-6 text-stone-400" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No Campaigns Yet</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
                This creator hasn't been added to any campaigns. Add them to track performance and deliverables.
              </p>
              <Button 
                variant="outline" 
                className="mt-4 rounded-full font-semibold"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add To Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {campaigns.map(assignment => (
                <InfluencerCampaignCard 
                  key={assignment.id} 
                  assignment={assignment} 
                  isAdmin={isAdmin} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-0 outline-none">
          <CampaignTimelineView campaigns={campaigns} />
        </TabsContent>
      </Tabs>

      <AddToCampaignModal 
        influencerId={influencerId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        existingCampaignIds={existingCampaignIds}
      />
    </div>
  );
}
