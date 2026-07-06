"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { KanbanSquare, LayoutList, CalendarDays, GanttChart } from "lucide-react";
import { TaskHero } from "./task-hero";
import { TaskKpiDashboard } from "./task-kpi-dashboard";
import { TaskInsightsSection } from "./task-insights-section";
import { TaskQuickFilters, type TaskQuickFilter } from "./task-quick-filters";
import { TaskKanban, type TaskWithDetails } from "./task-kanban";
import { TaskTableView } from "./task-table-view";
import { TaskSidebar } from "./task-sidebar";
import { TaskFilterDrawer, type TaskFilters } from "./task-filter-drawer";
import { cn } from "@/lib/utils";
import type { TaskKpis } from "@/actions/tasks";
import type { TaskInsight } from "@/actions/task-insights";

interface TaskPageClientProps {
  tasks: TaskWithDetails[];
  users: any[];
  campaigns: any[];
  kpis: TaskKpis;
  insights: TaskInsight[];
  currentUserId: string;
  isMyTasks?: boolean;
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
  { id: "kanban" as const, label: "Board", icon: KanbanSquare, disabled: false },
  { id: "list" as const, label: "List", icon: LayoutList, disabled: false },
  { id: "calendar" as const, label: "Calendar", icon: CalendarDays, disabled: true },
  { id: "timeline" as const, label: "Timeline", icon: GanttChart, disabled: true },
];

export function TaskPageClient({
  tasks,
  users,
  campaigns,
  kpis,
  insights,
  currentUserId,
  isMyTasks = false,
}: TaskPageClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [quickFilter, setQuickFilter] = useState<TaskQuickFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Apply drawer filters to tasks
  const filteredTasks = tasks.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.campaignId && t.campaignId !== filters.campaignId) return false;
    if (filters.assigneeId && t.assigneeId !== filters.assigneeId) return false;
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
      {/* Hero Section */}
      <TaskHero
        users={users}
        campaigns={campaigns}
        onFilterOpen={() => setIsFilterOpen(true)}
        title={isMyTasks ? "My Tasks" : "Task Operations"}
        description={
          isMyTasks
            ? "Focus on your assigned work and track personal productivity."
            : "Manage internal work, campaign deliverables, and team execution."
        }
      />

      {/* KPI Dashboard */}
      <TaskKpiDashboard kpis={kpis} />

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
                onClick={() => !mode.disabled && setViewMode(mode.id as ViewMode)}
                disabled={mode.disabled}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-[rgba(0,0,0,0.05)] text-[var(--color-text-primary)] shadow-sm"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
                  mode.disabled && "opacity-40 cursor-not-allowed"
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
            <TaskTableView tasks={filteredTasks} />
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
