"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateInfluencerAction } from "@/actions/influencers";

export function RateCardEditor({ influencer }: { influencer: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [reelRate, setReelRate] = useState(influencer.reelRate?.toString() || "");
  const [storyRate, setStoryRate] = useState(influencer.storyRate?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateInfluencerAction(influencer.id, {
        reelRate: reelRate ? parseFloat(reelRate) : null,
        storyRate: storyRate ? parseFloat(storyRate) : null,
      });
      toast.success("Rate card updated");
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update rates");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)] w-16 shrink-0">Reel ($)</span>
          <Input value={reelRate} onChange={(e) => setReelRate(e.target.value)} type="number" className="h-8 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)] w-16 shrink-0">Story ($)</span>
          <Input value={storyRate} onChange={(e) => setStoryRate(e.target.value)} type="number" className="h-8 text-sm" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" className="h-7 flex-1" onClick={handleSave} disabled={isSaving}>
            <Check className="h-3 w-3 mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" className="h-7" onClick={() => setIsEditing(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-secondary)]">Per Reel</span>
        <span className="text-sm font-bold text-[var(--color-text-primary)]">
          {influencer.reelRate ? `$${influencer.reelRate.toLocaleString()}` : "—"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-secondary)]">Per Story</span>
        <span className="text-sm font-bold text-[var(--color-text-primary)]">
          {influencer.storyRate ? `$${influencer.storyRate.toLocaleString()}` : "—"}
        </span>
      </div>
      <Button size="sm" variant="ghost" className="h-7 w-full justify-start text-[var(--color-brand-600)] px-1" onClick={() => setIsEditing(true)}>
        <Pencil className="h-3 w-3 mr-1.5" /> Edit Rates
      </Button>
    </div>
  );
}
