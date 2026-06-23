"use client";

import { useState, useEffect, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Check, Sparkles } from "lucide-react";
import { getCampaignsAction } from "@/actions/campaigns";
import { addInfluencerToCampaignAction } from "@/actions/influencer-campaigns";
import { computeBrandMatchAction, regenerateBrandMatchAction } from "@/actions/brand-match";
import { BrandMatchPanel, BrandMatchScoreBadge } from "@/components/campaigns/brand-match-panel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddToCampaignModalProps {
  influencerId: string;
  isOpen: boolean;
  onClose: () => void;
  existingCampaignIds: string[]; // Pass array of campaign IDs to disable them
}

export function AddToCampaignModal({ influencerId, isOpen, onClose, existingCampaignIds }: AddToCampaignModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [matches, setMatches] = useState<Record<string, any>>({});
  const [matchLoading, setMatchLoading] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCampaigns("");
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadCampaigns(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

  const loadCampaigns = async (query: string) => {
    setIsLoading(true);
    try {
      const res = await getCampaignsAction({ query, limit: 10 });
      setCampaigns(res.campaigns);
    } catch (err) {
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckMatch = async (campaignId: string) => {
    if (matches[campaignId]) {
      // Already computed — just toggle the panel open/closed.
      setExpandedId(expandedId === campaignId ? null : campaignId);
      return;
    }

    setMatchLoading((prev) => ({ ...prev, [campaignId]: true }));
    setExpandedId(campaignId);
    try {
      const result = await computeBrandMatchAction(campaignId, influencerId);
      if (result.success) {
        setMatches((prev) => ({ ...prev, [campaignId]: result.match }));
      } else {
        toast.error(result.error || "Failed to compute AI match");
        setExpandedId(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to compute AI match");
      setExpandedId(null);
    } finally {
      setMatchLoading((prev) => ({ ...prev, [campaignId]: false }));
    }
  };

  const handleRegenerateMatch = async (campaignId: string) => {
    setMatchLoading((prev) => ({ ...prev, [campaignId]: true }));
    try {
      const result = await regenerateBrandMatchAction(campaignId, influencerId);
      if (result.success) {
        setMatches((prev) => ({ ...prev, [campaignId]: result.match }));
      } else {
        toast.error(result.error || "Failed to recompute AI match");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to recompute AI match");
    } finally {
      setMatchLoading((prev) => ({ ...prev, [campaignId]: false }));
    }
  };

  const handleAdd = async (campaignId: string) => {
    startTransition(async () => {
      try {
        await addInfluencerToCampaignAction({
          campaignId,
          influencerId,
          status: "INVITED"
        });
        toast.success("Successfully added to campaign!");
        onClose();
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to add to campaign");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>Add to Campaign</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 border-b bg-stone-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Search campaigns or clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
              Searching...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
              No campaigns found.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {campaigns.map((campaign) => {
                const isAlreadyAdded = existingCampaignIds.includes(campaign.id);
                const match = matches[campaign.id];
                const isCheckingMatch = !!matchLoading[campaign.id];
                const isExpanded = expandedId === campaign.id;

                return (
                  <div key={campaign.id} className="p-2 hover:bg-stone-50 rounded-lg group transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[var(--color-text-primary)]">
                          {campaign.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {campaign.client?.companyName || "Unknown Client"} • {campaign.status}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {match ? (
                          <button onClick={() => handleCheckMatch(campaign.id)} className="cursor-pointer">
                            <BrandMatchScoreBadge score={match.matchScore} />
                          </button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-[var(--color-brand-600)] opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCheckMatch(campaign.id)}
                            disabled={isCheckingMatch}
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            {isCheckingMatch ? "Checking..." : "AI Match"}
                          </Button>
                        )}

                        {isAlreadyAdded ? (
                          <Button variant="ghost" size="sm" disabled className="h-8 text-emerald-600">
                            <Check className="w-4 h-4 mr-1.5" /> Added
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleAdd(campaign.id)}
                            disabled={isPending}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add
                          </Button>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && match && (
                        <BrandMatchPanel
                          match={match}
                          onRegenerate={() => handleRegenerateMatch(campaign.id)}
                          isRegenerating={isCheckingMatch}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
