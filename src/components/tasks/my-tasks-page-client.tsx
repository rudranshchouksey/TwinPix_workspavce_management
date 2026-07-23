"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { KanbanSquare, LayoutList } from "lucide-react";
import { TaskHero } from "./task-hero";
import { MyTasksDashboard } from "./my-tasks-dashboard";
import { TaskInsightsSection } from "./task-insights-section";
import { TaskQuickFilters, type TaskQuickFilter } from "./task-quick-filters";
import { TaskKanban, type TaskWithDetails } from "./task-kanban";
import { TaskTableView } from "./task-table-view";
import { TaskFilterBar } from "./task-filter-bar";
import { TaskViewOptions } from "./task-view-options";
import { TaskDialog } from "./task-dialog";
import { TaskSidebar } from "./task-sidebar";
import { useTaskFilters } from "@/hooks/use-task-filters";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";
import type { TaskKpis } from "@/actions/tasks";
import type { TaskInsight } from "@/actions/task-insights";

interface MyTasksPageClientProps {
  initialTasksData: { tasks: TaskWithDetails[], nextCursor?: string };
  users: any[];
  campaigns: any[];
  kpis: TaskKpis;
  insights: TaskInsight[];
  currentUserId: string;
}



type ViewMode = "kanban" | "list";

const VIEW_MODES = [
  { id: "kanban" as const, label: "Board", icon: KanbanSquare },
  { id: "list" as const, label: "List", icon: LayoutList },
];

export function MyTasksPageClient({
  initialTasksData,
  users,
  campaigns,
  kpis,
  insights,
  currentUserId,
}: MyTasksPageClientProps) {
  const { filters, setFilters, clearFilters } = useTaskFilters();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const [tasks, setTasks] = useState<TaskWithDetails[]>(initialTasksData.tasks);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialTasksData.nextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    "c": () => setIsCreateOpen(true),
    "v": () => setViewMode(prev => prev === "kanban" ? "list" : "kanban"),
    "/": () => {
      const searchInput = document.getElementById("task-search-input");
      if (searchInput) searchInput.focus();
    }
  }, [setViewMode, setIsCreateOpen]);

  // Sync state when server data changes (e.g. filters applied)
  const prevTasksRef = useRef(initialTasksData.tasks);
  useEffect(() => {
    if (prevTasksRef.current !== initialTasksData.tasks) {
      setTasks(initialTasksData.tasks);
      setNextCursor(initialTasksData.nextCursor);
      prevTasksRef.current = initialTasksData.tasks;
    }
  }, [initialTasksData]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const { getTasksAction } = await import("@/actions/tasks");
      const res = await getTasksAction({
        search: filters.search || undefined,
        statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
        priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
        assigneeIds: [currentUserId],
        campaignIds: filters.campaignIds.length > 0 ? filters.campaignIds : undefined,
        isOverdue: filters.isOverdue || undefined,
        sortBy: filters.sortBy || undefined,
        cursor: nextCursor,
      });
      setTasks(prev => [...prev, ...res.tasks as any]);
      setNextCursor(res.nextCursor);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sortedTasks = tasks;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <TaskHero
        users={users}
        campaigns={campaigns}
        onFilterOpen={() => {}}
        title="My Tasks"
        description="Focus on your assigned work and track personal productivity."
      />

      {/* Personal Dashboard */}
      <MyTasksDashboard tasks={tasks} currentUserId={currentUserId} />

      {/* AI Insights */}
      <TaskInsightsSection insights={insights} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <TaskFilterBar 
            filters={filters} 
            setFilters={setFilters} 
            clearFilters={clearFilters}
            users={users}
            campaigns={campaigns}
          />

          <div className="flex items-center gap-2">
            <TaskViewOptions filters={filters} setFilters={setFilters} />
            <div className="inline-flex items-center rounded-lg border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] p-0.5">
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = viewMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as ViewMode)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-[rgba(0,0,0,0.05)] text-[var(--color-text-primary)] shadow-sm"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 flex flex-col">
          {viewMode === "kanban" && (
            <TaskKanban
              initialData={sortedTasks}
              users={users}
              campaigns={campaigns}
              currentUserId={currentUserId}
              groupBy={filters.groupBy}
            />
          )}

          {viewMode === "list" && (
            <TaskTableView 
              tasks={sortedTasks} 
              users={users}
              campaigns={campaigns}
            />
          )}

          {nextCursor && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-6 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.02)] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isLoadingMore && <span className="w-4 h-4 border-2 border-slate-300 border-t-[var(--color-brand-500)] rounded-full animate-spin" />}
                {isLoadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>

        <TaskSidebar tasks={tasks} insights={insights} />
      </div>

      {isCreateOpen && (
        <TaskDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          users={users}
          campaigns={campaigns}
        />
      )}
    </div>
  );
}
