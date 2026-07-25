"use client";

import React, { useState, useMemo } from "react";
import { 
  CheckSquare, CheckCircle2, Clock, 
  AlertCircle, LayoutGrid, List, Calendar, 
  Activity, ArrowRight, BarChart2 
} from "lucide-react";
import { PremiumCard } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Views
import { TaskKanban } from "@/components/tasks/task-kanban";
import { TaskTableView } from "@/components/tasks/task-table-view";
import { ProjectTaskList } from "@/components/projects/tasks/project-task-list";
import { ProjectTaskCalendar } from "@/components/projects/tasks/project-task-calendar";
import { ProjectTaskTimeline } from "@/components/projects/tasks/project-task-timeline";
import { TaskDialog } from "@/components/tasks/task-dialog";

export function ProjectTasksTab({ project, users = [] }: { project: any, users?: any[] }) {
  const [activeView, setActiveView] = useState<"kanban" | "table" | "list" | "calendar" | "timeline">("kanban");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const tasks = project.tasks || [];
  const campaigns = project.campaigns || [];

  // Statistics Calculation
  const stats = useMemo(() => {
    let completed = 0;
    let late = 0;
    let highPriority = 0;
    let estHours = 0;
    let actualHours = 0;
    
    // Naive Blocked detection: checking for a tag or assuming specific string in description
    // For now, we'll check if status is some 'BLOCKED' (if added) or just leave it 0
    let blocked = 0; 

    const now = new Date();

    tasks.forEach((t: any) => {
      if (t.status === "DONE") completed++;
      if (t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now) late++;
      if (t.priority === "HIGH" || t.priority === "URGENT") highPriority++;
      if (t.estimatedHours) estHours += t.estimatedHours;
      if (t.actualHours) actualHours += t.actualHours;
    });

    return { completed, late, highPriority, estHours, actualHours, blocked };
  }, [tasks]);

  return (
    <div className="space-y-6">
      
      {/* HEADER & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <PremiumCard className="p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-16 h-16 text-[var(--color-brand-500)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Completed</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-[var(--color-text-primary)]">{stats.completed}</span>
              <span className="text-sm text-[var(--color-text-secondary)] mb-1">/ {tasks.length}</span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Late / Blocked</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-red-500">{stats.late}</span>
              <span className="text-sm text-[var(--color-text-secondary)] mb-1">late</span>
              {stats.blocked > 0 && <span className="text-sm text-red-500 font-bold mb-1 ml-2">({stats.blocked} blocked)</span>}
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-16 h-16 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">High Priority</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-amber-500">{stats.highPriority}</span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-16 h-16 text-[var(--color-brand-500)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Hours</span>
            <div className="flex items-end justify-between w-full">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-[var(--color-text-primary)]">{stats.actualHours}</span>
                <span className="text-sm text-[var(--color-text-secondary)] mb-1">logged</span>
              </div>
              <div className="text-xs font-bold text-gray-400 mb-1.5">{stats.estHours}h est</div>
            </div>
            {stats.estHours > 0 && (
              <Progress value={Math.min(100, (stats.actualHours / stats.estHours) * 100)} className="h-1.5 mt-3" />
            )}
          </div>
        </PremiumCard>

      </div>

      {/* CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
        
        <div className="flex items-center gap-1 bg-gray-50/50 p-1 rounded-lg">
          <Button 
            variant={activeView === "kanban" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setActiveView("kanban")}
            className={activeView === "kanban" ? "bg-white shadow-sm" : ""}
          >
            <LayoutGrid className="w-4 h-4 mr-2" /> Kanban
          </Button>
          <Button 
            variant={activeView === "table" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setActiveView("table")}
            className={activeView === "table" ? "bg-white shadow-sm" : ""}
          >
            <List className="w-4 h-4 mr-2" /> Table
          </Button>
          <Button 
            variant={activeView === "list" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setActiveView("list")}
            className={activeView === "list" ? "bg-white shadow-sm" : ""}
          >
            <BarChart2 className="w-4 h-4 mr-2" /> List
          </Button>
          <Button 
            variant={activeView === "timeline" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setActiveView("timeline")}
            className={activeView === "timeline" ? "bg-white shadow-sm" : ""}
          >
            <ArrowRight className="w-4 h-4 mr-2" /> Timeline
          </Button>
          <Button 
            variant={activeView === "calendar" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setActiveView("calendar")}
            className={activeView === "calendar" ? "bg-white shadow-sm" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" /> Calendar
          </Button>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white shadow-sm rounded-lg px-6">
          <CheckSquare className="w-4 h-4 mr-2" /> Create Task
        </Button>
      </div>

      {/* RENDER VIEW */}
      <div className="min-h-[500px]">
        {activeView === "kanban" && (
          <TaskKanban 
            initialData={tasks} 
            users={users} 
            campaigns={campaigns} 
            fixedProjectId={project.id}
            fixedClientId={project.clientId}
          />
        )}
        
        {activeView === "table" && (
          <TaskTableView 
            tasks={tasks} 
            users={users} 
            campaigns={campaigns} 
            fixedProjectId={project.id}
            fixedClientId={project.clientId}
          />
        )}

        {activeView === "list" && (
          <ProjectTaskList tasks={tasks} />
        )}

        {activeView === "calendar" && (
          <ProjectTaskCalendar tasks={tasks} />
        )}

        {activeView === "timeline" && (
          <ProjectTaskTimeline tasks={tasks} />
        )}
      </div>

      <TaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        users={users}
        campaigns={campaigns}
        fixedProjectId={project.id}
        fixedClientId={project.clientId}
      />
    </div>
  );
}
