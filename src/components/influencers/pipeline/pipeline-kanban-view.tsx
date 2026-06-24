"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  DropAnimation,
  closestCorners,
  defaultDropAnimationSideEffects,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import Link from "next/link";
import { AtSign, Users, Activity, Briefcase, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateInfluencerAction } from "@/actions/influencers";
import { InfluencerActionsDropdown } from "@/components/influencers/influencer-actions-dropdown";
import { STATUS_META, PRIORITY_META, computePriority, compactNumber, PipelineStatus } from "./pipeline-utils";

const dropAnimation: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }),
};

interface KanbanColumnData {
  status: PipelineStatus;
  items: any[];
  total: number;
}

function KanbanCard({ influencer, isOverlay, isAdmin }: { influencer: any; isOverlay?: boolean; isAdmin: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: influencer.id,
    data: { type: "Influencer", influencer },
  });

  const style: React.CSSProperties = { transition, transform: CSS.Transform.toString(transform), touchAction: "none" };

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="opacity-30 border-2 border-dashed border-[var(--color-border)] rounded-2xl h-36 bg-stone-50" />;
  }

  const priority = computePriority(influencer);
  const campaignCount = influencer._count?.campaigns ?? 0;

  return (
    <motion.div layout layoutId={influencer.id} transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`p-3.5 rounded-2xl border border-[var(--color-border)] bg-white/90 backdrop-blur-sm shadow-sm cursor-grab hover:shadow-md hover:border-[var(--color-brand-200)] transition-all group ${
          isOverlay ? "scale-105 shadow-2xl z-50 cursor-grabbing" : ""
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-full overflow-hidden bg-stone-100 shrink-0 border border-[var(--color-border)]">
              {influencer.profileImage ? (
                <img src={influencer.profileImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-stone-500">
                  {influencer.instagramHandle.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/influencers/${influencer.id}`}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-sm font-bold text-[var(--color-text-primary)] truncate max-w-[130px] block hover:text-[var(--color-brand-600)] hover:underline"
              >
                {influencer.influencerName || "Unnamed"}
              </Link>
              <div className="flex items-center text-[10px] text-[var(--color-text-muted)] mt-0.5">
                <AtSign className="w-2.5 h-2.5 mr-0.5" />
                <span className="truncate max-w-[100px]">{influencer.instagramHandle}</span>
              </div>
            </div>
          </div>
          <div onPointerDown={(e) => e.stopPropagation()}>
            <InfluencerActionsDropdown influencer={influencer} isAdmin={isAdmin} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-[var(--color-text-secondary)]">
          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-[var(--color-text-muted)]" /> {compactNumber(influencer.followers)}</span>
          {influencer.engagementRate != null && (
            <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[var(--color-text-muted)]" /> {influencer.engagementRate.toFixed(1)}%</span>
          )}
          {campaignCount > 0 && (
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-[var(--color-text-muted)]" /> {campaignCount}</span>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <Badge variant="outline" className={`${PRIORITY_META[priority.level].color} text-[9px] font-bold`}>
            {PRIORITY_META[priority.level].label}
          </Badge>
          {influencer.creatorIntelligence?.intelligenceScore != null && (
            <span className="flex items-center gap-1 text-[11px] font-black text-[var(--color-brand-600)]">
              <Sparkles className="w-3 h-3" /> {influencer.creatorIntelligence.intelligenceScore}
            </span>
          )}
        </div>

        {influencer.category && (
          <div className="mt-2 truncate text-[10px] font-semibold text-[var(--color-text-muted)] bg-stone-50 px-2 py-1 rounded-md border border-[var(--color-border)]">
            {influencer.category.split(",")[0]}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function KanbanColumn({ column, isAdmin }: { column: KanbanColumnData; isAdmin: boolean }) {
  const meta = STATUS_META[column.status];
  const { setNodeRef, isOver } = useSortable({ id: column.status, data: { type: "Column", column } });

  return (
    <div className="flex flex-col w-[300px] shrink-0">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: meta.dot }} />
          <span className="text-sm font-bold text-[var(--color-text-primary)]">{meta.label}</span>
          <span className="text-xs font-bold text-[var(--color-text-muted)]">{column.total}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] rounded-2xl border p-2.5 flex flex-col gap-2.5 transition-colors duration-200 ${
          isOver ? "bg-[var(--color-brand-50)] border-[var(--color-brand-300)]" : "bg-stone-50/60 border-[var(--color-border)]"
        }`}
      >
        <SortableContext items={column.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {column.items.map((influencer) => (
            <KanbanCard key={influencer.id} influencer={influencer} isAdmin={isAdmin} />
          ))}
        </SortableContext>

        {column.total > column.items.length && (
          <p className="text-center text-[11px] font-bold text-[var(--color-text-disabled)] py-2">
            +{column.total - column.items.length} more — switch to Table view to see all
          </p>
        )}
        {column.items.length === 0 && (
          <p className="text-center text-xs font-medium text-[var(--color-text-disabled)] py-8">No creators in this stage yet.</p>
        )}
      </div>
    </div>
  );
}

export function PipelineKanbanView({ columns: initialColumns, isAdmin }: { columns: KanbanColumnData[]; isAdmin: boolean }) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allItems = columns.flatMap((c) => c.items);
  const activeInfluencer = allItems.find((i) => i.id === activeId);

  const onDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeItem = allItems.find((i) => i.id === active.id);
    if (!activeItem) return;

    const isOverColumn = columns.some((c) => c.status === over.id);
    const overItem = allItems.find((i) => i.id === over.id);
    const newStatus = isOverColumn ? (over.id as PipelineStatus) : overItem?.status;

    if (!newStatus || newStatus === activeItem.status) return;

    const prevColumns = columns;
    setColumns((prev) =>
      prev.map((c) => {
        if (c.status === activeItem.status) return { ...c, items: c.items.filter((i) => i.id !== activeItem.id), total: c.total - 1 };
        if (c.status === newStatus) return { ...c, items: [{ ...activeItem, status: newStatus }, ...c.items], total: c.total + 1 };
        return c;
      })
    );

    try {
      await updateInfluencerAction(activeItem.id, { status: newStatus as any });
    } catch {
      setColumns(prevColumns);
    }
  };

  return (
    <DndContext id="pipeline-kanban" sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start">
        {columns.map((col) => (
          <KanbanColumn key={col.status} column={col} isAdmin={isAdmin} />
        ))}
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeInfluencer ? <KanbanCard influencer={activeInfluencer} isOverlay isAdmin={isAdmin} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
