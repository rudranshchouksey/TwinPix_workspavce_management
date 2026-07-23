"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { KanbanSquare, LayoutList } from "lucide-react";
import { TaskHero } from "./task-hero";
import { MyTasksDashboard } from "./my-tasks-dashboard";
import { TaskInsightsSection } from "./task-insights-section";
import { TaskQuickFilters, type TaskQuickFilter } from "./task-quick-filters";
import { TaskKanban, type TaskWithDetails } from "./task-kanban";
import { TaskTableView } from "./task-table-view";
import { TaskSidebar } from "./task-sidebar";
import { TaskFilterDrawer, type TaskFilters } from "./task-filter-drawer";
import { cn } from "@/lib/utils";
import type { TaskKpis } from "@/actions/tasks";
import type { TaskInsight } from "@/actions/task-insights";

interface MyTasksPageClientProps {
  tasks: TaskWithDetails[];
  users: any[];
  campaigns: any[];
  kpis: TaskKpis;
  insights: TaskInsight[];
  currentUserId: string;
}

const DEFAULT_FILTERS: TaskFilters = {
  status: "",
  priority: "",
  campaignId: "",
  assigneeId: "",
  dueDateFrom: "",
  dueDateTo: "",
};

type ViewMode = "kanban" | "list";

const VIEW_MODES = [
  { id: "kanban" as const, label: "Board", icon: KanbanSquare },
  { id: "list" as const, label: "List", icon: LayoutList },
];

export function MyTasksPageClient({
  tasks,
  users,
  campaigns,
  kpis,
  insights,
  currentUserId,
}: MyTasksPageClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [quickFilter, setQuickFilter] = useState<TaskQuickFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Apply drawer filters
  const filteredTasks = tasks.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.campaignId && t.campaignId !== filters.campaignId) return false;
    if (filters.dueDateFrom && t.dueDate) {
      if (new Date(t.dueDate) < new Date(filters.dueDateFrom)) return false;
    }
    if (filters.dueDateTo && t.dueDate) {
      if (new Date(t.dueDate) > new Date(filters.dueDateTo)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <TaskHero
        users={users}
        campaigns={campaigns}
        onFilterOpen={() => setIsFilterOpen(true)}
        title="My Tasks"
        description="Focus on your assigned work and track personal productivity."
      />

      {/* Personal Dashboard */}
      <MyTasksDashboard tasks={tasks} currentUserId={currentUserId} />

      {/* AI Insights */}
      <TaskInsightsSection insights={insights} />

      {/* Quick Filters + View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <TaskQuickFilters
          active={quickFilter}
          onChange={setQuickFilter}
          currentUserId={currentUserId}
        />

        {/* Segmented View Control */}
        <div className="inline-flex items-center rounded-lg border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] p-0.5">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
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

      {/* Main Content + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
          {viewMode === "kanban" && (
            <TaskKanban
              initialData={filteredTasks}
              users={users}
              campaigns={campaigns}
              quickFilter={quickFilter}
              currentUserId={currentUserId}
              searchQuery={searchQuery}
            />
          )}

          {viewMode === "list" && (
            <TaskTableView 
              tasks={filteredTasks} 
              users={users}
              campaigns={campaigns}
            />
          )}
        </div>

        <TaskSidebar tasks={tasks} insights={insights} />
      </div>

      {/* Filter Drawer */}
      <TaskFilterDrawer
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        users={users}
        campaigns={campaigns}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
