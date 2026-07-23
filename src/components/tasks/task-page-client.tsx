"use client";

import { useState } from "react";
import { KanbanSquare, LayoutList, CalendarDays, GanttChart } from "lucide-react";
import { TaskHero } from "./task-hero";
import { TaskKpiDashboard } from "./task-kpi-dashboard";
import { TaskInsightsSection } from "./task-insights-section";
import { TaskKanban, type TaskWithDetails } from "./task-kanban";
import { TaskTableView } from "./task-table-view";
import { TaskSidebar } from "./task-sidebar";
import { TaskFilterBar } from "./task-filter-bar";
import { TaskViewOptions } from "./task-view-options";
import { useTaskFilters } from "@/hooks/use-task-filters";
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
  const { filters, setFilters, clearFilters } = useTaskFilters();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
    }
    if (filters.priorities.length > 0 && !filters.priorities.includes(t.priority)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(t.status)) return false;
    
    if (filters.assigneeIds.length > 0) {
      const isUnassignedSelected = filters.assigneeIds.includes("UNASSIGNED");
      if (isUnassignedSelected && !t.assigneeId) {
        // match
      } else if (!t.assigneeId || !filters.assigneeIds.includes(t.assigneeId)) {
        return false;
      }
    }
    
    if (filters.campaignIds.length > 0 && (!t.campaignId || !filters.campaignIds.includes(t.campaignId))) return false;
    
    if (filters.isOverdue) {
      if (!t.dueDate || t.status === "DONE" || new Date(t.dueDate) >= new Date(new Date().setHours(0,0,0,0))) return false;
    }

    return true;
  });

  // Apply sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (filters.sortBy) {
      case "createdAt_desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "createdAt_asc": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "dueDate_asc": 
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case "dueDate_desc":
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      case "priority_desc": {
        const pOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      case "priority_asc": {
        const pOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (pOrder[a.priority] || 0) - (pOrder[b.priority] || 0);
      }
      case "title_asc": return a.title.localeCompare(b.title);
      case "title_desc": return b.title.localeCompare(a.title);
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">
      <TaskHero
        users={users}
        campaigns={campaigns}
        onFilterOpen={() => {}} 
        title={isMyTasks ? "My Tasks" : "Task Operations"}
        description={
          isMyTasks
            ? "Focus on your assigned work and track personal productivity."
            : "Manage internal work, campaign deliverables, and team execution."
        }
      />

      <TaskKpiDashboard kpis={kpis} />
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
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
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
        </div>

        <TaskSidebar tasks={tasks} insights={insights} />
      </div>
    </div>
  );
}
