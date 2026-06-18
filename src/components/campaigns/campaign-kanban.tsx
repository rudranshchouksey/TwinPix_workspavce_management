"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay
} from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Loader2, DollarSign, Calendar } from "lucide-react";
import { updateCampaignAction } from "@/actions/campaigns";
import { Badge } from "@/components/ui/badge";

// KanBan columns mapped to CampaignStatus
const KANBAN_COLUMNS = [
  { id: "PLANNING", title: "Planning", color: "border-gray-500/20" },
  { id: "ACTIVE", title: "Active", color: "border-emerald-500/20" },
  { id: "REVIEW", title: "Review", color: "border-amber-500/20" },
  { id: "COMPLETED", title: "Completed", color: "border-blue-500/20" },
];

function SortableCampaignCard({ campaign }: { campaign: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: campaign.id, data: { type: "Campaign", campaign } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.08)] rounded-xl p-4 mb-3 hover:border-[rgba(0,0,0,0.15)] cursor-grab active:cursor-grabbing transition-colors"
    >
      <Link href={`/campaigns/${campaign.id}`} className="block" onPointerDown={(e) => e.stopPropagation()}>
        <h4 className="font-semibold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-brand-400)] transition-colors line-clamp-2">
          {campaign.name}
        </h4>
      </Link>
      
      <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
        {campaign.client?.companyName}
      </p>

      <div className="flex items-center justify-between mt-4">
        <Badge variant="outline" className="bg-black/20 border-white/5 text-xs font-normal">
          <DollarSign className="w-3 h-3 mr-0.5 text-[var(--color-brand-400)]" />
          {(campaign.budget / 1000).toFixed(1)}k
        </Badge>
        
        {campaign.endDate && (
          <span className="text-[10px] text-[var(--color-text-disabled)] flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(campaign.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}

export function CampaignKanban({ initialData }: { initialData: any[] }) {
  const [campaigns, setCampaigns] = useState(initialData);
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const campaign = campaigns.find(c => c.id === active.id);
    setActiveCampaign(campaign || null);
  };

  const handleDragEnd = async (event: any) => {
    setActiveCampaign(null);
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id; // Could be a column ID or another card ID
    
    // Find what status we dropped onto
    let newStatus = "";
    if (KANBAN_COLUMNS.some(col => col.id === overId)) {
      newStatus = overId;
    } else {
      const overCampaign = campaigns.find(c => c.id === overId);
      if (overCampaign) newStatus = overCampaign.status;
    }

    if (!newStatus) return;

    const activeCampaign = campaigns.find(c => c.id === activeId);
    if (!activeCampaign || activeCampaign.status === newStatus) return;

    // Optimistic UI update
    setCampaigns(prev => prev.map(c => 
      c.id === activeId ? { ...c, status: newStatus } : c
    ));

    // Server update
    try {
      await updateCampaignAction(activeId, { status: newStatus as any });
      toast.success("Campaign status updated");
    } catch (error: any) {
      toast.error("Failed to update status");
      // Revert on error
      setCampaigns(initialData);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(column => {
          const columnCampaigns = campaigns.filter(c => c.status === column.id);
          
          return (
            <div key={column.id} className={`flex flex-col rounded-xl bg-[rgba(0,0,0,0.02)] border ${column.color} min-h-[500px] p-4`}>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider">
                  {column.title}
                </h3>
                <span className="text-xs bg-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] px-2 py-0.5 rounded-full font-medium">
                  {columnCampaigns.length}
                </span>
              </div>
              
              <SortableContext 
                id={column.id} 
                items={columnCampaigns.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1">
                  {columnCampaigns.map(campaign => (
                    <SortableCampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                  {columnCampaigns.length === 0 && (
                    <div className="h-24 rounded-xl border border-dashed border-[rgba(0,0,0,0.1)] flex items-center justify-center text-xs text-[var(--color-text-disabled)]">
                      Drop campaigns here
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
      
      <DragOverlay>
        {activeCampaign ? (
          <div className="bg-[var(--color-surface-800)] border border-[var(--color-brand-500)] shadow-2xl rounded-xl p-4 rotate-2 scale-105 opacity-90 cursor-grabbing">
            <h4 className="font-semibold text-sm text-white">{activeCampaign.name}</h4>
            <p className="text-xs text-gray-400 mt-1">{activeCampaign.client?.companyName}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
