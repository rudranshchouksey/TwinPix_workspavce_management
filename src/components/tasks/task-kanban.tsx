"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Plus,
  MessageSquare,
  Calendar,
  User,
  MoreHorizontal,
  Paperclip,
  Flag,
  Inbox,
  Trash,
  Pencil,
} from "lucide-react";
import { updateTaskAction, deleteTaskAction } from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "./task-dialog";
import { Task } from "@prisma/client";
import type { TaskQuickFilter } from "./task-quick-filters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "./task-dialog";
import { Task } from "@prisma/client";
import type { TaskQuickFilter } from "./task-quick-filters";

export type TaskWithDetails = Task & {
  campaign?: { id: string; name: string } | null;
  assignee?: { id: string; name: string | null; image: string | null } | null;
  comments?: any[];
};

const KANBAN_COLUMNS = [
  { id: "TODO", title: "To Do", dot: "#a8a29e", accent: "rgba(168,162,158,0.15)" },
  { id: "IN_PROGRESS", title: "In Progress", dot: "#3b82f6", accent: "rgba(59,130,246,0.10)" },
  { id: "REVIEW", title: "Review", dot: "#f59e0b", accent: "rgba(245,158,11,0.10)" },
  { id: "DONE", title: "Done", dot: "#10b981", accent: "rgba(16,185,129,0.10)" },
];

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  URGENT: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  HIGH: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  MEDIUM: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  LOW: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" },
};

function isOverdue(task: TaskWithDetails): boolean {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
}

function isDueToday(task: TaskWithDetails): boolean {
  if (!task.dueDate || task.status === "DONE") return false;
  const today = new Date();
  const due = new Date(task.dueDate);
  return due.toDateString() === today.toDateString();
}

function SortableTaskCard({ 
  task,
  onEdit,
  onDelete
}: { 
  task: TaskWithDetails;
  onEdit: (task: TaskWithDetails) => void;
  onDelete: (taskId: string) => void;
}) {
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

  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      whileHover={{ y: -2 }}
      {...attributes}
      {...listeners}
      className="relative bg-white border border-[rgba(0,0,0,0.07)] rounded-[20px] p-4 mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] cursor-grab active:cursor-grabbing transition-shadow duration-200 group"
    >
      {/* Priority accent bar */}
      <span
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{
          background:
            task.priority === "URGENT"
              ? "#ef4444"
              : task.priority === "HIGH"
              ? "#f59e0b"
              : task.priority === "MEDIUM"
              ? "#3b82f6"
              : "#a8a29e",
        }}
      />

      <div className="pl-2.5">
        {/* Top row: Priority + Campaign */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${priority.bg} ${priority.text} ${priority.border} text-[10px] py-0 px-2 rounded-full uppercase tracking-wider font-semibold`}
            >
              <Flag className="w-2.5 h-2.5 mr-0.5" />
              {task.priority}
            </Badge>
            {task.campaign && (
              <span
                className="text-[10px] text-[var(--color-brand-600)] bg-[var(--color-brand-50)] px-2 py-0.5 rounded-full truncate max-w-[120px] font-medium"
                title={task.campaign.name}
              >
                {task.campaign.name}
              </span>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onPointerDown={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-red-600 focus:text-red-600">
                <Trash className="w-4 h-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <Link
          href={`/tasks/${task.id}`}
          className="block mb-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <h4 className="font-semibold text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-600)] transition-colors line-clamp-2 leading-snug">
            {task.title}
          </h4>
        </Link>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed mb-3">
            {task.description}
          </p>
        )}

        {/* Meta row: due date, comments, attachments */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
            {task.dueDate && (
              <span
                className={`flex items-center gap-1 font-medium ${
                  overdue
                    ? "text-red-500"
                    : dueToday
                    ? "text-amber-600"
                    : ""
                }`}
              >
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {(task.comments?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {task.comments?.length}
              </span>
            )}
            {task.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {task.attachments.length}
              </span>
            )}
          </div>

          {/* Assignee avatar */}
          {task.assignee ? (
            <div
              className="w-6 h-6 rounded-full bg-[var(--color-brand-500)] text-[10px] text-white flex items-center justify-center font-semibold overflow-hidden ring-2 ring-white"
              title={task.assignee.name || undefined}
            >
              {task.assignee.image ? (
                <img
                  src={task.assignee.image}
                  alt={task.assignee.name || "User avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                task.assignee.name?.substring(0, 2).toUpperCase()
              )}
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full bg-[rgba(0,0,0,0.06)] text-[var(--color-text-disabled)] flex items-center justify-center ring-2 ring-white"
              title="Unassigned"
            >
              <User className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ColumnEmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-36 rounded-2xl border-2 border-dashed border-[rgba(0,0,0,0.08)] text-center px-4">
      <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center">
        <Inbox className="w-5 h-5 text-[var(--color-text-disabled)]" />
      </div>
      <p className="text-xs font-medium text-[var(--color-text-muted)]">
        No tasks in {title}
      </p>
      <p className="text-[11px] text-[var(--color-text-disabled)]">
        Drag tasks here or create new
      </p>
    </div>
  );
}

interface TaskKanbanProps {
  initialData: TaskWithDetails[];
  users: any[];
  campaigns: any[];
  quickFilter?: TaskQuickFilter;
  currentUserId?: string;
  searchQuery?: string;
}

export function TaskKanban({
  initialData,
  users,
  campaigns,
  quickFilter = "all",
  currentUserId,
  searchQuery,
}: TaskKanbanProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>(initialData);
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState("TODO");
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);

  useEffect(() => {
    setTasks(initialData);
  }, [initialData]);

  // Apply quick filter
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.campaign?.name.toLowerCase().includes(q)
      );
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    switch (quickFilter) {
      case "assigned-to-me":
        return result.filter((t) => t.assigneeId === currentUserId);
      case "high-priority":
        return result.filter((t) => t.priority === "HIGH" || t.priority === "URGENT");
      case "today":
        return result.filter(
          (t) => t.dueDate && new Date(t.dueDate) >= startOfDay && new Date(t.dueDate) <= endOfDay
        );
      case "overdue":
        return result.filter((t) => isOverdue(t));
      case "completed":
        return result.filter((t) => t.status === "DONE");
      case "campaign":
        return result.filter((t) => t.campaignId);
      case "unassigned":
        return result.filter((t) => !t.assigneeId);
      default:
        return result;
    }
  }, [tasks, quickFilter, currentUserId, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === (event.active.id as string));
      setActiveTask(task || null);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      let newStatus = "";
      if (KANBAN_COLUMNS.some((col) => col.id === overId)) {
        newStatus = overId;
      } else {
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask) newStatus = overTask.status;
      }
      if (!newStatus) return;

      const taskToMove = tasks.find((t) => t.id === activeId);
      if (!taskToMove || taskToMove.status === newStatus) return;

      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: newStatus as any } : t
        )
      );

      try {
        await updateTaskAction(activeId, {
          status: newStatus as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE",
        });
        toast.success("Task status updated");
      } catch (error: Error | any) {
        toast.error(error?.message || "Failed to update status");
        setTasks(initialData);
      }
    },
    [tasks, initialData]
  );

  const handleCreateClick = useCallback((statusId: string) => {
    setCreateColumnId(statusId);
    setEditingTask(null);
    setIsCreateOpen(true);
  }, []);

  const handleEditTask = useCallback((task: TaskWithDetails) => {
    setEditingTask(task);
    setIsCreateOpen(true);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      await deleteTaskAction(taskId);
      toast.success("Task deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
      setTasks(initialData);
    }
  }, [initialData]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.id);

            return (
              <div
                key={column.id}
                className="flex flex-col rounded-2xl bg-[rgba(0,0,0,0.015)] border border-[rgba(0,0,0,0.06)] min-h-[520px] p-3"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1.5 pt-1 sticky top-0 z-10">
                  <h3 className="font-semibold text-xs text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: column.dot }}
                    />
                    {column.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] bg-[rgba(0,0,0,0.06)] text-[var(--color-text-primary)] px-2 py-0.5 rounded-full font-semibold">
                      {columnTasks.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      onClick={() => handleCreateClick(column.id)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Cards area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
                  <SortableContext
                    id={column.id}
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="min-h-[100px]">
                      <AnimatePresence initial={false}>
                        {columnTasks.map((task) => (
                          <SortableTaskCard 
                            key={task.id} 
                            task={task} 
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </AnimatePresence>
                      {columnTasks.length === 0 && (
                        <ColumnEmptyState title={column.title.toLowerCase()} />
                      )}
                    </div>
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-white border-2 border-[var(--color-brand-400)] shadow-2xl rounded-[20px] p-4 rotate-1 scale-105 cursor-grabbing w-[300px]">
              <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">
                {activeTask.title}
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">
                {activeTask.description || "No description"}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setTimeout(() => setEditingTask(null), 300);
        }}
        task={editingTask}
        users={users}
        campaigns={campaigns}
        defaultStatus={createColumnId}
      />
    </>
  );
}
