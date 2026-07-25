"use client";

import React, { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";

export function ProjectTaskCalendar({ tasks }: { tasks: any[] }) {
  const router = useRouter();
  
  // Transform tasks to FullCalendar event format
  const events = tasks.map(task => {
    // Determine color based on status or priority
    let color = "#6b7280"; // gray
    if (task.status === "DONE") color = "#10b981"; // emerald
    else if (task.priority === "URGENT") color = "#f43f5e"; // rose
    else if (task.priority === "HIGH") color = "#f59e0b"; // amber
    else if (task.priority === "MEDIUM") color = "#3b82f6"; // blue
    
    return {
      id: task.id,
      title: task.title,
      start: task.dueDate || task.createdAt, // fallback to created date if no due date
      allDay: true, // Tasks typically just have due dates (days), not specific times in this schema unless time is specified
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        task
      }
    };
  });

  const handleEventClick = (info: any) => {
    router.push(`/tasks/${info.event.id}`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[800px]">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek"
        }}
        events={events}
        eventClick={handleEventClick}
        height="100%"
        eventContent={(arg) => {
          return (
            <div className="px-2 py-1 text-xs truncate overflow-hidden font-medium cursor-pointer transition-opacity hover:opacity-80">
              <span className="font-bold mr-1">•</span>
              {arg.event.title}
            </div>
          );
        }}
      />
    </div>
  );
}
