import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { CheckSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

export function ProjectTasksTab({ project }: { project: any }) {
  const tasks = project.tasks || [];

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-16 text-center">
        <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4">
          <CheckSquare className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No tasks</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">No tasks have been created for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task: any) => (
        <PremiumCard key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${
                task.priority === 'URGENT' ? 'bg-red-500' :
                task.priority === 'HIGH' ? 'bg-amber-500' :
                task.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{task.title}</h4>
            </div>
            {task.description && (
              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1 ml-4">{task.description}</p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-6 ml-4 md:ml-0">
            {task.dueDate && (
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
              </div>
            )}
            
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              task.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-500' :
              task.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
              task.status === 'REVIEW' ? 'bg-amber-500/10 text-amber-500' :
              'bg-gray-500/10 text-gray-500'
            }`}>
              {task.status.replace('_', ' ')}
            </span>

            {task.assignee && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.image || ""} />
                  <AvatarFallback className="text-[10px]">{task.assignee.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-[var(--color-text-primary)]">{task.assignee.name}</span>
              </div>
            )}
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}
