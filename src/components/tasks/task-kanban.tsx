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
  DragOverlay,
  DragStartEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Plus, MessageSquare, Calendar, User } from "lucide-react";
import { updateTaskAction } from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "./task-dialog";
import { Task } from "@prisma/client";

export type TaskWithDetails = Task & {
  campaign?: { name: string } | null;
  assignee?: { name: string | null; image: string | null } | null;
  comments?: any[];
};

const KANBAN_COLUMNS = [
  { id: "TODO", title: "To Do", color: "border-gray-500/20", headerColor: "text-gray-400" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-blue-500/20", headerColor: "text-blue-400" },
  { id: "REVIEW", title: "Review", color: "border-amber-500/20", headerColor: "text-amber-400" },
  { id: "DONE", title: "Done", color: "border-emerald-500/20", headerColor: "text-emerald-400" },
];

function SortableTaskCard({ task }: { task: TaskWithDetails }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "Task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "URGENT": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "HIGH": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "MEDIUM": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "LOW": return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      default: return "";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[var(--color-surface-900)] border border-[rgba(0,0,0,0.08)] rounded-xl p-4 mb-3 hover:border-[rgba(0,0,0,0.15)] cursor-grab active:cursor-grabbing transition-colors group"
    >
      <div className="flex justify-between items-start mb-2">
        <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-[10px] py-0 px-2 rounded-full uppercase tracking-wider`}>
          {task.priority}
        </Badge>
        {task.campaign && (
          <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[100px]" title={task.campaign.name}>
            {task.campaign.name}
          </span>
        )}
      </div>

      <Link href={`/tasks/${task.id}`} className="block mb-3" onPointerDown={(e) => e.stopPropagation()}>
        <h4 className="font-medium text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-400)] transition-colors line-clamp-2 leading-snug">
          {task.title}
        </h4>
      </Link>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {(task.comments?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {task.comments?.length}
            </span>
          )}
        </div>

        {task.assignee ? (
          <div className="w-6 h-6 rounded-full bg-[var(--color-brand-500)] text-[10px] text-white flex items-center justify-center font-semibold overflow-hidden ring-2 ring-[var(--color-surface-900)]" title={task.assignee.name || undefined}>
            {task.assignee.image ? (
              <img src={task.assignee.image} alt={task.assignee.name || "User avatar"} className="w-full h-full object-cover" />
            ) : (
              task.assignee.name?.substring(0, 2).toUpperCase()
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-[rgba(0,0,0,0.1)] text-gray-400 flex items-center justify-center ring-2 ring-[var(--color-surface-900)]" title="Unassigned">
            <User className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskKanban({ initialData, users, campaigns }: { initialData: TaskWithDetails[], users: any[], campaigns: any[] }) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>(initialData);
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState("TODO");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id as string);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    let newStatus = "";
    if (KANBAN_COLUMNS.some(col => col.id === overId)) {
      newStatus = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (!newStatus) return;

    const taskToMove = tasks.find(t => t.id === activeId);
    if (!taskToMove || taskToMove.status === newStatus) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => 
      t.id === activeId ? { ...t, status: newStatus as any } : t
    ));

    try {
      await updateTaskAction(activeId, { status: newStatus as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" });
      toast.success("Task status updated");
    } catch (error: Error | any) {
      toast.error(error?.message || "Failed to update status");
      // Revert on error
      setTasks(initialData);
    }
  };

  const handleCreateClick = (statusId: string) => {
    setCreateColumnId(statusId);
    setIsCreateOpen(true);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar h-[calc(100vh-200px)] min-h-[500px]">
          {KANBAN_COLUMNS.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            
            return (
              <div key={column.id} className={`flex flex-col min-w-[320px] max-w-[320px] rounded-2xl bg-[rgba(0,0,0,0.02)] border ${column.color} p-4 h-full`}>
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-sm ${column.headerColor} uppercase tracking-wider`}>
                      {column.title}
                    </h3>
                    <span className="text-xs bg-[rgba(0,0,0,0.1)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full font-medium">
                      {columnTasks.length}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    onClick={() => handleCreateClick(column.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                  <SortableContext 
                    id={column.id} 
                    items={columnTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="min-h-[100px]">
                      {columnTasks.map(task => (
                        <SortableTaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </div>
        
        <DragOverlay>
          {activeTask ? (
            <div className="bg-[var(--color-surface-800)] border border-[var(--color-brand-500)] shadow-2xl rounded-xl p-4 rotate-3 scale-105 opacity-90 cursor-grabbing w-[300px]">
              <h4 className="font-semibold text-sm text-white">{activeTask.title}</h4>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{activeTask.description || "No description"}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        users={users} 
        campaigns={campaigns}
        defaultStatus={createColumnId}
      />
    </>
  );
}
