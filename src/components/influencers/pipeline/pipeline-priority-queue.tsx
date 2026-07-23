"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AtSign, ArrowRight, Send, Handshake, MessageSquare, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListOrdered } from "lucide-react";
import { bulkMarkContactedAction, bulkUpdateInfluencerStatusAction } from "@/actions/pipeline";
import { GenerateOutreachModal } from "@/components/influencers/generate-outreach-modal";
import { PRIORITY_META } from "./pipeline-utils";
import { toast } from "sonner";

const RECOMMENDED_ACTION: Record<string, string> = {
  NEW_LEAD: "Send initial outreach",
  CONTACTED: "Follow up on outreach",
  REPLIED: "Move to negotiation",
  NEGOTIATING: "Finalize negotiation terms",
};

export function PipelinePriorityQueue({ items }: { items: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [outreachTarget, setOutreachTarget] = useState<{ id: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleMarkContacted = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      await bulkMarkContactedAction([id]);
      toast.success("Marked as contacted");
      setBusyId(null);
      router.refresh();
    });
  };

  const handleMoveToNegotiating = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      await bulkUpdateInfluencerStatusAction([id], "NEGOTIATING");
      toast.success("Moved to negotiating");
      setBusyId(null);
      router.refresh();
    });
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ListOrdered}
        title="You're all caught up"
        description="No creators are currently flagged for priority action. Check back later or browse the full pipeline in Table view."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Today&apos;s Priorities</h2>
        <p className="text-xs font-medium text-[var(--color-text-muted)]">Ranked automatically by urgency, engagement, and reach.</p>
      </div>

      {items.map(({ influencer, priority, followUp }, i) => (
        <motion.div
          key={influencer.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.03 }}
          className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm flex items-center gap-4"
        >
          <div className="flex flex-col items-center justify-center w-12 shrink-0">
            <span className="text-xl font-black text-[var(--color-text-primary)]">{priority.score}</span>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">score</span>
          </div>

          <div className="h-10 w-10 rounded-full overflow-hidden bg-stone-100 shrink-0 border border-[var(--color-border)]">
            {influencer.profileImage ? (
              <img src={influencer.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-stone-500">
                {influencer.instagramHandle.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/influencers/${influencer.id}`} className="text-sm font-bold text-[var(--color-text-primary)] hover:text-[var(--color-brand-600)] hover:underline">
                {influencer.influencerName || "Unnamed"}
              </Link>
              <Badge variant="outline" className={`${PRIORITY_META[priority.level as keyof typeof PRIORITY_META].color} text-[9px] font-bold`}>
                {PRIORITY_META[priority.level as keyof typeof PRIORITY_META].label} Priority
              </Badge>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] flex items-center mt-0.5">
              <AtSign className="w-3 h-3 mr-0.5" />
              {influencer.instagramHandle}
            </p>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-1.5 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-[var(--color-brand-500)]" />
              {RECOMMENDED_ACTION[influencer.status] || "Review and decide next step"}
            </p>
            <p className="text-[11px] text-[var(--color-text-disabled)] mt-1">{priority.reasons.join(" · ")}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(influencer.status === "NEW_LEAD" || influencer.status === "CONTACTED") && (
              <Button size="sm" variant="outline" className="rounded-full font-bold text-xs" disabled={isPending && busyId === influencer.id} onClick={() => handleMarkContacted(influencer.id)}>
                {isPending && busyId === influencer.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                Mark Contacted
              </Button>
            )}
            {influencer.status === "REPLIED" && (
              <Button size="sm" variant="outline" className="rounded-full font-bold text-xs" disabled={isPending && busyId === influencer.id} onClick={() => handleMoveToNegotiating(influencer.id)}>
                {isPending && busyId === influencer.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Handshake className="w-3.5 h-3.5 mr-1.5" />}
                Move to Negotiating
              </Button>
            )}
            <Button
              size="sm"
              className="rounded-full font-bold text-xs bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)]"
              onClick={() => setOutreachTarget({ id: influencer.id, name: influencer.influencerName || influencer.instagramHandle })}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Outreach
            </Button>
          </div>
        </motion.div>
      ))}

      {outreachTarget && (
        <GenerateOutreachModal influencerId={outreachTarget.id} influencerName={outreachTarget.name} isOpen={true} onClose={() => setOutreachTarget(null)} />
      )}
    </div>
  );
}
