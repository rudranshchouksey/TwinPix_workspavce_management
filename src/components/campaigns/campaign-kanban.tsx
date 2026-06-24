"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { DollarSign, Calendar, Users, ListChecks, Radar } from "lucide-react";
import { updateCampaignAction } from "@/actions/campaigns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { CampaignQuickActions } from "./campaign-quick-actions";
import { CampaignDialog } from "./campaign-dialog";
import { CampaignAddInfluencersModal } from "./campaign-add-influencers-modal";
import { CampaignBriefModal } from "./campaign-brief-modal";
import {
  getCompletionPct,
  getUrgency,
  getDaysRemainingLabel,
  getAssignedManager,
  getExpectedReach,
  compactNumber,
  STATUS_BADGE_STYLES,
  URGENCY_COLORS,
} from "./campaign-card-utils";

const KANBAN_COLUMNS = [
  { id: "PLANNING", title: "Planning", dot: "#a8a29e" },
  { id: "ACTIVE", title: "Active", dot: "#10b981" },
  { id: "REVIEW", title: "Review", dot: "#d97706" },
  { id: "COMPLETED", title: "Completed", dot: "#2563eb" },
];

function InfluencerStack({ campaign }: { campaign: any }) {
  const assignments = campaign.influencers || [];
  if (assignments.length === 0) {
    return <span className="text-xs text-[var(--color-text-disabled)]">No influencers yet</span>;
  }
  const visible = assignments.slice(0, 4);
  const remaining = assignments.length - visible.length;

  return (
    <AvatarGroup>
      {visible.map((a: any) => (
        <Avatar key={a.id} size="sm">
          <AvatarImage src={a.influencer?.profileImage || undefined} alt="" />
          <AvatarFallback>{(a.influencer?.influencerName || a.influencer?.instagramHandle || "?")[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <AvatarGroupCount>
          <span className="text-[10px] font-semibold">+{remaining}</span>
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}

function CampaignCard({
  campaign,
  onEdit,
  onAddInfluencers,
  onGenerateBrief,
  dragHandleProps,
  isDragging,
}: {
  campaign: any;
  onEdit: (c: any) => void;
  onAddInfluencers: (c: any) => void;
  onGenerateBrief: (c: any) => void;
  dragHandleProps?: any;
  isDragging?: boolean;
}) {
  const completion = getCompletionPct(campaign);
  const urgency = getUrgency(campaign);
  const daysLabel = getDaysRemainingLabel(campaign);
  const manager = getAssignedManager(campaign);
  const reach = getExpectedReach(campaign);
  const deliverablesCount = campaign._count?.tasks ?? 0;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="relative rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white p-4 mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow duration-200"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...dragHandleProps}
    >
      <span
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ background: URGENCY_COLORS[urgency] }}
      />

      <div className="flex items-start justify-between gap-2 pl-2.5">
        <div className="min-w-0">
          <Link
            href={`/campaigns/${campaign.id}`}
            className="block font-semibold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-brand-600)] transition-colors line-clamp-2"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {campaign.name}
          </Link>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{campaign.client?.companyName}</p>
        </div>
        <div onPointerDown={(e) => e.stopPropagation()}>
          <CampaignQuickActions campaign={campaign} onEdit={onEdit} onAddInfluencers={onAddInfluencers} onGenerateBrief={onGenerateBrief} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 pl-2.5">
        <Badge variant="outline" className={`${STATUS_BADGE_STYLES[campaign.status]} rounded-full text-[10px] py-0 px-2 font-semibold`}>
          {campaign.status}
        </Badge>
        {daysLabel && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              urgency === "overdue"
                ? "bg-red-50 text-red-600"
                : urgency === "urgent"
                ? "bg-orange-50 text-orange-600"
                : urgency === "soon"
                ? "bg-amber-50 text-amber-700"
                : "bg-[rgba(0,0,0,0.04)] text-[var(--color-text-muted)]"
            }`}
          >
            {daysLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pl-2.5">
        <Badge variant="outline" className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] text-xs font-medium">
          <DollarSign className="w-3 h-3 mr-0.5 text-[var(--color-brand-500)]" />
          {(campaign.budget / 1000).toFixed(1)}k
        </Badge>
        {campaign.endDate && (
          <span className="text-[11px] text-[var(--color-text-disabled)] flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(campaign.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      <div className="mt-3 pl-2.5">
        <div className="flex items-center justify-between text-[10px] font-medium text-[var(--color-text-muted)] mb-1">
          <span>Progress</span>
          <span>{completion}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)]"
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pl-2.5">
        <InfluencerStack campaign={campaign} />
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {campaign.influencers?.length || 0}
          </span>
          <span className="flex items-center gap-1">
            <ListChecks className="w-3 h-3" />
            {deliverablesCount}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 pl-2.5 border-t border-[rgba(0,0,0,0.06)]">
        <span className="text-[11px] text-[var(--color-text-muted)] truncate">
          {manager ? manager : <span className="italic text-[var(--color-text-disabled)]">Unassigned</span>}
        </span>
        {reach > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-brand-600)]">
            <Radar className="w-3 h-3" />
            {compactNumber(reach)} reach
          </span>
        )}
      </div>
    </motion.div>
  );
}

function SortableCampaignCard({
  campaign,
  onEdit,
  onAddInfluencers,
  onGenerateBrief,
}: {
  campaign: any;
  onEdit: (c: any) => void;
  onAddInfluencers: (c: any) => void;
  onGenerateBrief: (c: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: campaign.id,
    data: { type: "Campaign", campaign },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="cursor-grab active:cursor-grabbing">
      <CampaignCard
        campaign={campaign}
        onEdit={onEdit}
        onAddInfluencers={onAddInfluencers}
        onGenerateBrief={onGenerateBrief}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

function ColumnEmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border border-dashed border-[rgba(0,0,0,0.1)] text-center px-4">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">No campaigns in {title}</p>
      <p className="text-[11px] text-[var(--color-text-disabled)]">Drag a card here or create a new campaign</p>
    </div>
  );
}

export function CampaignKanban({ initialData, clients }: { initialData: any[]; clients: any[] }) {
  const [campaigns, setCampaigns] = useState(initialData);
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);

  const [editCampaign, setEditCampaign] = useState<any | null>(null);
  const [addInfluencersCampaign, setAddInfluencersCampaign] = useState<any | null>(null);
  const [briefCampaign, setBriefCampaign] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveCampaign(campaigns.find((c) => c.id === active.id) || null);
  };

  const handleDragEnd = async (event: any) => {
    setActiveCampaign(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let newStatus = "";
    if (KANBAN_COLUMNS.some((col) => col.id === overId)) {
      newStatus = overId;
    } else {
      const overCampaign = campaigns.find((c) => c.id === overId);
      if (overCampaign) newStatus = overCampaign.status;
    }
    if (!newStatus) return;

    const active_ = campaigns.find((c) => c.id === activeId);
    if (!active_ || active_.status === newStatus) return;

    setCampaigns((prev) => prev.map((c) => (c.id === activeId ? { ...c, status: newStatus } : c)));

    try {
      await updateCampaignAction(activeId, { status: newStatus as any });
      toast.success("Campaign status updated");
    } catch {
      toast.error("Failed to update status");
      setCampaigns(initialData);
    }
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnCampaigns = campaigns.filter((c) => c.status === column.id);

            return (
              <div
                key={column.id}
                className="flex flex-col rounded-2xl bg-[rgba(0,0,0,0.015)] border border-[rgba(0,0,0,0.06)] min-h-[520px] p-3"
              >
                <div className="flex items-center justify-between mb-3 px-1.5 pt-1">
                  <h3 className="font-semibold text-xs text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: column.dot }} />
                    {column.title}
                  </h3>
                  <span className="text-[11px] bg-[rgba(0,0,0,0.06)] text-[var(--color-text-primary)] px-2 py-0.5 rounded-full font-semibold">
                    {columnCampaigns.length}
                  </span>
                </div>

                <SortableContext id={column.id} items={columnCampaigns.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1">
                    <AnimatePresence initial={false}>
                      {columnCampaigns.map((campaign) => (
                        <SortableCampaignCard
                          key={campaign.id}
                          campaign={campaign}
                          onEdit={setEditCampaign}
                          onAddInfluencers={setAddInfluencersCampaign}
                          onGenerateBrief={setBriefCampaign}
                        />
                      ))}
                    </AnimatePresence>
                    {columnCampaigns.length === 0 && <ColumnEmptyState title={column.title.toLowerCase()} />}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeCampaign ? (
            <div className="bg-white border-2 border-[var(--color-brand-400)] shadow-2xl rounded-2xl p-4 rotate-1 scale-105 cursor-grabbing">
              <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">{activeCampaign.name}</h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{activeCampaign.client?.companyName}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CampaignDialog
        open={!!editCampaign}
        onOpenChange={(open) => !open && setEditCampaign(null)}
        campaign={editCampaign}
        clients={clients}
      />

      {addInfluencersCampaign && (
        <CampaignAddInfluencersModal
          campaignId={addInfluencersCampaign.id}
          isOpen={!!addInfluencersCampaign}
          onClose={() => setAddInfluencersCampaign(null)}
          existingInfluencerIds={(addInfluencersCampaign.influencers || []).map((a: any) => a.influencerId)}
        />
      )}

      {briefCampaign && (
        <CampaignBriefModal
          isOpen={!!briefCampaign}
          onClose={() => setBriefCampaign(null)}
          campaignId={briefCampaign.id}
          campaignName={briefCampaign.name}
        />
      )}
    </>
  );
}
