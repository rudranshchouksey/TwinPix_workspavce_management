"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserCircle2 } from "lucide-react";
import { bulkAssignManagerAction } from "@/actions/pipeline";
import { toast } from "sonner";

export function BulkAssignManagerModal({
  open,
  onClose,
  influencerIds,
  managers,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  influencerIds: string[];
  managers: { id: string; name: string | null; image: string | null }[];
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    startTransition(async () => {
      try {
        await bulkAssignManagerAction(influencerIds, selected);
        toast.success(`Manager updated for ${influencerIds.length} creator(s)`);
        onDone();
        onClose();
      } catch (err: any) {
        toast.error(err.message || "Failed to assign manager");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Manager</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          <button
            onClick={() => setSelected(null)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${
              selected === null ? "bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]" : "hover:bg-[var(--color-surface-900)]"
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
              <UserCircle2 className="w-4 h-4 text-stone-400" />
            </div>
            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Unassigned</span>
          </button>
          {managers.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${
                selected === m.id ? "bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]" : "hover:bg-[var(--color-surface-900)]"
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
                {m.image ? (
                  <img src={m.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-stone-500">{m.name?.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className="text-sm font-bold text-[var(--color-text-primary)]">{m.name}</span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
