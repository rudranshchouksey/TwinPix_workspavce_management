"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
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
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Plus, Inbox } from "lucide-react";
import { updateTaskAction, deleteTaskAction, duplicateTaskAction } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "./task-dialog";
import { Task, TaskStatus } from "@prisma/client";
import type { TaskQuickFilter } from "./task-quick-filters";
import { SortableTaskCard, TaskCard } from "./task-card";

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
        return result.filter((t) => {
          if (!t.dueDate || t.status === "DONE") return false;
          return new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
        });
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

  const handleDuplicateTask = useCallback(async (taskId: string) => {
    try {
      toast.loading("Duplicating task...", { id: "duplicate-task" });
      const duplicated = await duplicateTaskAction(taskId);
      setTasks((prev) => [duplicated as any, ...prev]);
      toast.success("Task duplicated", { id: "duplicate-task" });
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate task", { id: "duplicate-task" });
    }
  }, []);

  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: status as any } : t));
      await updateTaskAction(taskId, { status: status as any });
      toast.success("Task status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
      setTasks(initialData);
    }
  }, [initialData]);

  const handleAssignTask = useCallback(async (taskId: string, assigneeId: string) => {
    try {
      const assignedUser = users.find(u => u.id === assigneeId) || null;
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, assigneeId: assigneeId || null, assignee: assignedUser } : t));
      await updateTaskAction(taskId, { assigneeId: assigneeId || null });
      toast.success("Task assigned");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign task");
      setTasks(initialData);
    }
  }, [initialData, users]);

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
                            onDuplicate={handleDuplicateTask}
                            onStatusChange={handleStatusChange}
                            onAssign={handleAssignTask}
                            users={users}
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
            <div className="w-[300px]">
              <TaskCard
                task={activeTask}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onDuplicate={handleDuplicateTask}
                onStatusChange={handleStatusChange}
                onAssign={handleAssignTask}
                users={users}
                isDragging={true}
              />
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
