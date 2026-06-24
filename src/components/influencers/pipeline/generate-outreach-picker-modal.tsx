"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, AtSign, Loader2 } from "lucide-react";
import { getPipelineInfluencersAction } from "@/actions/pipeline";
import { GenerateOutreachModal } from "@/components/influencers/generate-outreach-modal";

export function GenerateOutreachPickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      const { influencers } = await getPipelineInfluencersAction({ search }, 1, 15);
      if (active) {
        setResults(influencers);
        setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, open]);

  if (selected) {
    return (
      <GenerateOutreachModal
        influencerId={selected.id}
        influencerName={selected.name}
        isOpen={true}
        onClose={() => {
          setSelected(null);
          onClose();
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Outreach</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input
            autoFocus
            placeholder="Search a creator by name or handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-80 overflow-y-auto -mx-2 px-2 space-y-1">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="text-sm text-[var(--color-text-disabled)] text-center py-6">
              {search ? "No creators found." : "Start typing to search creators."}
            </p>
          )}
          {!loading &&
            results.map((r: any) => (
              <button
                key={r.id}
                onClick={() => setSelected({ id: r.id, name: r.influencerName || r.instagramHandle })}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--color-surface-900)] transition-colors text-left"
              >
                <div className="h-9 w-9 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                  {r.profileImage ? (
                    <img src={r.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-stone-500">{r.instagramHandle.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{r.influencerName || "Unnamed"}</p>
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center truncate">
                    <AtSign className="w-3 h-3 mr-0.5" />
                    {r.instagramHandle}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
