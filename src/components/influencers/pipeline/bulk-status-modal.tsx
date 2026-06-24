"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { bulkUpdateInfluencerStatusAction } from "@/actions/pipeline";
import { PIPELINE_STATUSES, STATUS_META } from "./pipeline-utils";
import { toast } from "sonner";

export function BulkStatusModal({
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
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        await bulkUpdateInfluencerStatusAction(influencerIds, selected);
        toast.success(`Status updated for ${influencerIds.length} creator(s)`);
        onDone();
        onClose();
      } catch (err: any) {
        toast.error(err.message || "Failed to update status");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`px-3.5 py-2 rounded-xl border text-sm font-bold transition-all ${
                selected === s ? `${STATUS_META[s].color} ring-2 ring-offset-1 ring-[var(--color-brand-400)]` : STATUS_META[s].color
              }`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isPending || !selected}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
