"use client";

import { useState, useEffect, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Check, Sparkles, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInfluencersAction } from "@/actions/influencers";
import { addInfluencerToCampaignAction } from "@/actions/influencer-campaigns";
import { computeBrandMatchAction, regenerateBrandMatchAction } from "@/actions/brand-match";
import { BrandMatchPanel, BrandMatchScoreBadge } from "@/components/campaigns/brand-match-panel";

interface CampaignAddInfluencersModalProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
  existingInfluencerIds: string[];
}

export function CampaignAddInfluencersModal({
  campaignId,
  isOpen,
  onClose,
  existingInfluencerIds,
}: CampaignAddInfluencersModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [matches, setMatches] = useState<Record<string, any>>({});
  const [matchLoading, setMatchLoading] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) load("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

  const load = async (query: string) => {
    setIsLoading(true);
    try {
      const res = await getInfluencersAction(query, undefined, undefined, 1, 10);
      setInfluencers(res.influencers);
    } catch {
      toast.error("Failed to load influencers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckMatch = async (influencerId: string) => {
    if (matches[influencerId]) {
      setExpandedId(expandedId === influencerId ? null : influencerId);
      return;
    }
    setMatchLoading((prev) => ({ ...prev, [influencerId]: true }));
    setExpandedId(influencerId);
    try {
      const result = await computeBrandMatchAction(campaignId, influencerId);
      if (result.success) {
        setMatches((prev) => ({ ...prev, [influencerId]: result.match }));
      } else {
        toast.error(result.error || "Failed to compute AI match");
        setExpandedId(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to compute AI match");
      setExpandedId(null);
    } finally {
      setMatchLoading((prev) => ({ ...prev, [influencerId]: false }));
    }
  };

  const handleRegenerateMatch = async (influencerId: string) => {
    setMatchLoading((prev) => ({ ...prev, [influencerId]: true }));
    try {
      const result = await regenerateBrandMatchAction(campaignId, influencerId);
      if (result.success) setMatches((prev) => ({ ...prev, [influencerId]: result.match }));
      else toast.error(result.error || "Failed to recompute AI match");
    } catch (err: any) {
      toast.error(err.message || "Failed to recompute AI match");
    } finally {
      setMatchLoading((prev) => ({ ...prev, [influencerId]: false }));
    }
  };

  const handleAdd = async (influencerId: string) => {
    startTransition(async () => {
      try {
        await addInfluencerToCampaignAction({ campaignId, influencerId, status: "INVITED" });
        setAddedIds((prev) => new Set(prev).add(influencerId));
        toast.success("Influencer added to campaign");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to add influencer");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--color-brand-500)]" />
            Add Influencers
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b bg-stone-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Search influencers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Searching...</div>
          ) : influencers.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No influencers found.</div>
          ) : (
            <div className="p-2 space-y-1">
              {influencers.map((inf) => {
                const isAdded = existingInfluencerIds.includes(inf.id) || addedIds.has(inf.id);
                const match = matches[inf.id];
                const isCheckingMatch = !!matchLoading[inf.id];
                const isExpanded = expandedId === inf.id;

                return (
                  <div key={inf.id} className="p-2 hover:bg-stone-50 rounded-lg group transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar size="sm">
                          <AvatarImage src={inf.profileImage || undefined} alt="" />
                          <AvatarFallback>{(inf.influencerName || inf.instagramHandle || "?")[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                            {inf.influencerName || inf.instagramHandle}
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)] truncate">
                            @{inf.instagramHandle} • {inf.followers ? `${(inf.followers / 1000).toFixed(0)}k followers` : "—"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {match ? (
                          <button onClick={() => handleCheckMatch(inf.id)} className="cursor-pointer">
                            <BrandMatchScoreBadge score={match.matchScore} />
                          </button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-[var(--color-brand-600)] opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCheckMatch(inf.id)}
                            disabled={isCheckingMatch}
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            {isCheckingMatch ? "Checking..." : "AI Match"}
                          </Button>
                        )}

                        {isAdded ? (
                          <Button variant="ghost" size="sm" disabled className="h-8 text-emerald-600">
                            <Check className="w-4 h-4 mr-1.5" /> Added
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleAdd(inf.id)}
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
                          onRegenerate={() => handleRegenerateMatch(inf.id)}
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
