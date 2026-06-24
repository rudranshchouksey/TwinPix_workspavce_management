"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  Tag,
  Send,
  Megaphone,
  Sparkles,
  Trash2,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/campaigns/confirm-dialog";
import {
  bulkMarkContactedAction,
  bulkDeleteInfluencersAction,
  exportInfluencersAction,
} from "@/actions/pipeline";
import { regenerateCreatorAIInsightsAction } from "@/actions/creator-intelligence";
import { BulkAssignManagerModal } from "./bulk-assign-manager-modal";
import { BulkStatusModal } from "./bulk-status-modal";
import { BulkAddToCampaignModal } from "./bulk-add-to-campaign-modal";
import { toast } from "sonner";

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  managers: { id: string; name: string | null; image: string | null }[];
  isAdmin: boolean;
}

export function BulkActionBar({ selectedIds, onClear, managers, isAdmin }: BulkActionBarProps) {
  const router = useRouter();
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [busyLabel, setBusyLabel] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const handleSendOutreach = () => {
    startTransition(async () => {
      await bulkMarkContactedAction(selectedIds);
      toast.success(`Marked ${selectedIds.length} creator(s) as contacted`);
      onClear();
      refresh();
    });
  };

  const handleGenerateAiSummary = () => {
    setBusyLabel("Generating AI summaries...");
    startTransition(async () => {
      const results = await Promise.allSettled(selectedIds.map((id) => regenerateCreatorAIInsightsAction(id)));
      const succeeded = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length;
      toast.success(`Generated AI intelligence for ${succeeded}/${selectedIds.length} creator(s)`);
      setBusyLabel(null);
      onClear();
      refresh();
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      const csv = await exportInfluencersAction({ ids: selectedIds });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `creators-selected-${selectedIds.length}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleDelete = async () => {
    await bulkDeleteInfluencersAction(selectedIds);
    toast.success(`Deleted ${selectedIds.length} creator(s)`);
    onClear();
    refresh();
  };

  return (
    <>
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white/95 backdrop-blur-md shadow-xl px-4 py-3"
          >
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--color-border)]">
              <span className="text-sm font-black text-[var(--color-text-primary)]">{selectedIds.length}</span>
              <span className="text-xs font-bold text-[var(--color-text-muted)]">selected</span>
            </div>

            {isPending && busyLabel ? (
              <span className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] px-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {busyLabel}
              </span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button size="sm" variant="ghost" className="rounded-full font-bold text-xs h-8" onClick={() => setManagerModalOpen(true)}>
                  <UserCircle2 className="w-3.5 h-3.5 mr-1.5" /> Assign Manager
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full font-bold text-xs h-8" onClick={() => setStatusModalOpen(true)}>
                  <Tag className="w-3.5 h-3.5 mr-1.5" /> Change Status
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full font-bold text-xs h-8" onClick={handleSendOutreach} disabled={isPending}>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Send Outreach
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full font-bold text-xs h-8" onClick={() => setCampaignModalOpen(true)}>
                  <Megaphone className="w-3.5 h-3.5 mr-1.5" /> Add To Campaign
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full font-bold text-xs h-8" onClick={handleGenerateAiSummary} disabled={isPending}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate AI Summary
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full font-bold text-xs h-8" onClick={handleExport} disabled={isPending}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                </Button>
                {isAdmin && (
                  <Button size="sm" variant="ghost" className="rounded-full font-bold text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                  </Button>
                )}
              </div>
            )}

            <button onClick={onClear} className="ml-1 p-1.5 rounded-full hover:bg-[var(--color-surface-900)] transition-colors">
              <X className="w-4 h-4 text-[var(--color-text-muted)]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <BulkAssignManagerModal
        open={managerModalOpen}
        onClose={() => setManagerModalOpen(false)}
        influencerIds={selectedIds}
        managers={managers}
        onDone={() => {
          onClear();
          refresh();
        }}
      />
      <BulkStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        influencerIds={selectedIds}
        onDone={() => {
          onClear();
          refresh();
        }}
      />
      <BulkAddToCampaignModal
        open={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        influencerIds={selectedIds}
        onDone={() => {
          onClear();
          refresh();
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${selectedIds.length} creator(s)?`}
        description="This will permanently remove these creators and all of their posts, reels, files, and campaign assignments. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
