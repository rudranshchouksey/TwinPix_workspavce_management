"use client";

import React from "react";
import { format, isSameMonth, startOfMonth, parseISO } from "date-fns";
import { CheckCircle2, Clock, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProjectTaskTimeline({ tasks }: { tasks: any[] }) {
  // Filter out tasks without due dates for the timeline, or group them in "No Date"
  const tasksWithDates = tasks.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const tasksWithoutDates = tasks.filter(t => !t.dueDate);

  // Group by month
  const groupedTasks: Record<string, any[]> = {};
  
  tasksWithDates.forEach(task => {
    const monthKey = format(new Date(task.dueDate), "MMMM yyyy");
    if (!groupedTasks[monthKey]) groupedTasks[monthKey] = [];
    groupedTasks[monthKey].push(task);
  });

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
        <Clock className="h-10 w-10 mb-3 opacity-20" />
        <p>No tasks with due dates to show on timeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="relative border-l-2 border-gray-100 ml-3 md:ml-6 space-y-12 pb-8">
        
        {Object.entries(groupedTasks).map(([month, monthTasks]) => (
          <div key={month} className="relative">
            {/* Month Header */}
            <div className="flex items-center mb-6">
              <div className="absolute -left-[35px] md:-left-[41px] w-8 h-8 rounded-full bg-[var(--color-brand-50)] border-4 border-white flex items-center justify-center shadow-sm">
                <CalendarIcon className="w-3.5 h-3.5 text-[var(--color-brand-500)]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 ml-2">{month}</h3>
            </div>

            {/* Tasks in this month */}
            <div className="space-y-6 ml-2">
              {monthTasks.map(task => {
                const isLate = new Date(task.dueDate) < new Date() && task.status !== "DONE";
                
                return (
                  <div key={task.id} className="relative group pl-6">
                    {/* Timeline Node */}
                    <div className={`absolute top-2 -left-[22px] w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 ${
                      task.status === 'DONE' ? 'bg-emerald-500' : 
                      isLate ? 'bg-red-500' : 'bg-[var(--color-brand-500)]'
                    }`} />
                    
                    {/* Task Content */}
                    <div className="bg-gray-50/50 group-hover:bg-[var(--color-brand-50)] border border-gray-100 group-hover:border-[var(--color-brand-200)] rounded-xl p-4 transition-all">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        
                        <div className="flex-1">
                          <Link href={`/tasks/${task.id}`}>
                            <h4 className="font-semibold text-gray-900 hover:text-[var(--color-brand-600)] mb-1">
                              {task.title}
                            </h4>
                          </Link>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </span>
                            
                            {task.campaign && (
                              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-2">
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

                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            task.status === 'REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>

                          {task.assignee && (
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={task.assignee.image || ""} />
                                <AvatarFallback className="text-[8px]">{task.assignee.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-gray-700 pr-1">{task.assignee.name}</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
