"use client";

import { useState, useEffect, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { getCampaignsAction } from "@/actions/campaigns";
import { bulkAddToCampaignAction } from "@/actions/pipeline";
import { toast } from "sonner";

export function BulkAddToCampaignModal({
  open,
  onClose,
  influencerIds,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  influencerIds: string[];
  onDone: () => void;
}) {
  const [search, setSearch] = useState("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getCampaignsAction({ query: search, archived: false }).then((res: any) => {
      setCampaigns(res.campaigns || []);
      setLoading(false);
    });
  }, [open, search]);

  const handleSelect = (campaignId: string) => {
    startTransition(async () => {
      try {
        const result = await bulkAddToCampaignAction(influencerIds, campaignId);
        toast.success(`Added ${result.added} creator(s) to campaign${result.skipped ? ` (${result.skipped} already assigned)` : ""}`);
        onDone();
        onClose();
      } catch (err: any) {
        toast.error(err.message || "Failed to add to campaign");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {influencerIds.length} Creator{influencerIds.length === 1 ? "" : "s"} To Campaign</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
            </div>
          )}
          {!loading && campaigns.length === 0 && (
            <p className="text-sm text-[var(--color-text-disabled)] text-center py-6">No campaigns found.</p>
          )}
          {!loading &&
            campaigns.map((c: any) => (
              <button
                key={c.id}
                disabled={isPending}
                onClick={() => handleSelect(c.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-surface-900)] transition-colors text-left disabled:opacity-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{c.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{c.client?.companyName}</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-full font-bold shrink-0" disabled={isPending}>
                  Select
                </Button>
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
