"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncInfluencerAction } from "@/actions/instagram-sync";
import { toast } from "sonner";

export function InstagramSyncButton({ influencerId, lastSyncDate }: { influencerId: string, lastSyncDate?: Date | null }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info("Scraping Instagram data... This may take a minute.");
    
    try {
      const result = await syncInfluencerAction(influencerId);
      
      if (result.success) {
        toast.success("Successfully synced Instagram profile and content!");
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Unexpected error: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {lastSyncDate && (
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          Last sync: {new Date(lastSyncDate).toLocaleDateString()}
        </span>
      )}
      <Button 
        onClick={handleSync} 
        disabled={isSyncing}
        className="bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white shadow-sm"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Syncing..." : "Refresh Instagram Data"}
      </Button>
    </div>
  );
}
