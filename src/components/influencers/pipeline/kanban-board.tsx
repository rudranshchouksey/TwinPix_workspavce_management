"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { InfluencerStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { AtSign, MoreHorizontal } from "lucide-react";
import { updateInfluencerAction } from "@/actions/influencers";
import { InfluencerActionsDropdown } from "../influencer-actions-dropdown";

const COLUMNS = [
  { id: "NEW_LEAD", title: "New Lead", color: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
  { id: "CONTACTED", title: "Contacted", color: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400" },
  { id: "REPLIED", title: "Replied", color: "border-purple-500/20 bg-purple-500/10 text-purple-400" },
  { id: "NEGOTIATING", title: "Negotiating", color: "border-orange-500/20 bg-orange-500/10 text-orange-400" },
  { id: "ACTIVE", title: "Active", color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
  { id: "ONBOARDED", title: "Onboarded", color: "border-teal-500/20 bg-teal-500/10 text-teal-400" },
  { id: "BLACKLISTED", title: "Blacklisted", color: "border-red-500/20 bg-red-500/10 text-red-400" },
];

interface KanbanCardProps {
  influencer: any;
  isOverlay?: boolean;
  isAdmin?: boolean;
}

function KanbanCard({ influencer, isOverlay, isAdmin = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: influencer.id,
    data: { type: "Influencer", influencer },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-dashed border-[rgba(0,0,0,0.2)] rounded-lg h-24 bg-[var(--color-surface-900)]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-lg border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] cursor-grab hover:border-[rgba(0,0,0,0.2)] hover:shadow-lg transition-all group ${
        isOverlay ? "scale-105 shadow-2xl z-50 cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-[rgba(0,0,0,0.1)] shrink-0">
            {influencer.profileImage ? (
              <img src={influencer.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-white/50">
                {influencer.instagramHandle.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-[120px]">
              {influencer.influencerName || "Unnamed"}
            </p>
            <div className="flex items-center text-[10px] text-[var(--color-text-muted)] mt-0.5">
              <AtSign className="w-2.5 h-2.5 mr-1" />
              <span className="truncate max-w-[100px]">@{influencer.instagramHandle}</span>
            </div>
          </div>
        </div>
        <div onPointerDown={(e) => e.stopPropagation()}>
          <InfluencerActionsDropdown influencer={influencer} isAdmin={isAdmin} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-[var(--color-text-secondary)]">
          {influencer.followers ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(influencer.followers) : "0"} followers
        </div>
        {influencer.category && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,0,0,0.05)] text-[var(--color-text-muted)] truncate max-w-[80px]">
            {influencer.category.split(",")[0]}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ column, items, isAdmin }: { column: typeof COLUMNS[0]; items: any[]; isAdmin: boolean }) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  return (
    <div className="flex flex-col w-[300px] shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${column.color} border font-semibold text-xs py-0.5`}>
            {column.title}
          </Badge>
          <span className="text-xs font-medium text-[var(--color-text-muted)]">{items.length}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 min-h-[500px] bg-[rgba(0,0,0,0.02)] rounded-xl border border-[rgba(0,0,0,0.05)] p-2 flex flex-col gap-2"
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((influencer) => (
            <KanbanCard key={influencer.id} influencer={influencer} isAdmin={isAdmin} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ initialData, isAdmin = false }: { initialData: any[], isAdmin?: boolean }) {
  const [data, setData] = useState(initialData);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find the influencer being dragged
    const activeItem = data.find((i) => i.id === activeId);
    if (!activeItem) return;

    // Find the new status column
    let newStatus = activeItem.status;
    const isOverColumn = COLUMNS.some((c) => c.id === overId);
    
    if (isOverColumn) {
      newStatus = overId as string;
    } else {
      const overItem = data.find((i) => i.id === overId);
      if (overItem) {
        newStatus = overItem.status;
      }
    }

    if (newStatus === activeItem.status) return;

    // Optimistically update UI
    setData((prev) =>
      prev.map((i) => (i.id === activeId ? { ...i, status: newStatus } : i))
    );

    // Call server action
    try {
      await updateInfluencerAction(activeItem.id, { status: newStatus as any });
    } catch (err) {
      console.error("Failed to update status", err);
      // Revert on error
      setData((prev) =>
        prev.map((i) => (i.id === activeId ? { ...i, status: activeItem.status } : i))
      );
    }
  };

  const activeInfluencer = data.find((i) => i.id === activeId);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-8 pt-4 custom-scrollbar items-start h-[calc(100vh-200px)]">
        {COLUMNS.map((col) => (
          <KanbanColumn key={col.id} column={col} items={data.filter((i) => i.status === col.id)} isAdmin={isAdmin} />
        ))}
      </div>

      <DragOverlay>
        {activeInfluencer ? <KanbanCard influencer={activeInfluencer} isOverlay isAdmin={isAdmin} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
