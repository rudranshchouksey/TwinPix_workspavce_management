"use client";

import React from "react";
import { format } from "date-fns";
import { CheckSquare, AlertCircle, Clock, MoreHorizontal, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ProjectTaskList({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
        <CheckSquare className="h-10 w-10 mb-3 opacity-20" />
        <p>No tasks found for these filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => {
        const isLate = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
        
        return (
          <div key={task.id} className="group bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-[var(--color-brand-300)] transition-all flex flex-col md:flex-row md:items-center gap-4">
            
            <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                task.status === 'DONE' ? 'bg-emerald-50 text-emerald-500' :
                task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-500' :
                task.status === 'REVIEW' ? 'bg-amber-50 text-amber-500' : 'bg-gray-100 text-gray-500'
              }`}>
                {task.status === 'DONE' ? <CheckSquare className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/tasks/${task.id}`}>
                  <h4 className="font-semibold text-gray-900 truncate hover:text-[var(--color-brand-600)] transition-colors">
                    {task.title}
                  </h4>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  {task.campaign && (
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      {task.campaign.name}
                    </span>
                  )}
                  {isLate && (
                    <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> LATE
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 md:w-1/3">
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6 border">
                    <AvatarImage src={task.assignee.image || ""} />
                    <AvatarFallback className="text-[10px]">{task.assignee.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-gray-700">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-xs font-medium text-gray-400 italic">Unassigned</span>
              )}

              {task.dueDate && (
                <div className="text-xs text-gray-500 font-medium">
                  {format(new Date(task.dueDate), "MMM d, yyyy")}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 flex-1 justify-end">
              {task.estimatedHours > 0 && (
                <div className="w-24 hidden lg:block">
                  <div className="flex justify-between text-[10px] mb-1 font-semibold text-gray-500">
                    <span>{task.actualHours || 0}h logged</span>
                    <span>{task.estimatedHours}h est</span>
                  </div>
                  <Progress value={Math.min(100, ((task.actualHours || 0) / task.estimatedHours) * 100)} className="h-1.5" />
                </div>
              )}

              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                task.priority === 'URGENT' ? 'bg-rose-50 text-rose-600' :
                task.priority === 'HIGH' ? 'bg-amber-50 text-amber-600' :
                task.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {task.priority}
              </span>
              
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <MessageSquare className="w-4 h-4" />
                {task.comments?.length || 0}
              </div>

              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </Button>
            </div>

          </div>
        );
      })}
    </div>
  );
}
