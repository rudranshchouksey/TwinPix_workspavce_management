"use client";

import React, { useRef, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";
import { PremiumCard } from "@/components/ui/premium-card";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const EVENT_COLORS: Record<string, string> = {
  TASK: "#3b82f6", // blue
  CAMPAIGN: "#8b5cf6", // purple
  MEETING: "#f59e0b", // amber
  CONTENT_POST: "#ec4899", // pink
  DEADLINE: "#ef4444", // red
  
  CAMPAIGN_LAUNCH: "#7c3aed", // deep purple
  CAMPAIGN_DEADLINE: "#dc2626", // strong red
  CAMPAIGN_REVIEW: "#ea580c", // orange
  
  INSTAGRAM_POST: "#db2777", // deep pink
  INSTAGRAM_REEL: "#be185d", // darker pink
  INSTAGRAM_STORY: "#f472b6", // light pink
  YOUTUBE_UPLOAD: "#dc2626", // red
  
  BRAND_COLLABORATION: "#0ea5e9", // sky blue
  CLIENT_MEETING: "#059669", // emerald
  DISCOVERY_CALL: "#10b981", // green
  TEAM_MEETING: "#34d399", // light green
  INTERNAL_STANDUP: "#6ee7b7", // pale green
  
  FOLLOW_UP_REMINDER: "#f59e0b", // amber
  CONTRACT_REMINDER: "#d97706", // dark amber
  PAYMENT_REMINDER: "#65a30d", // lime
  DELIVERABLE_DUE: "#059669", // emerald
  APPROVAL_DEADLINE: "#e11d48", // rose
  CONTENT_APPROVAL: "#2563eb", // bright blue
  
  INFLUENCER_PHOTOSHOOT: "#c026d3", // fuchsia
  VIDEO_SHOOT: "#9333ea", // purple
  LIVE_EVENT: "#4f46e5", // indigo
  PODCAST_RECORDING: "#7e22ce", // dark purple
  CONTRACT_SIGNING: "#475569", // slate
  INVOICE_DUE: "#16a34a", // green
};

export function ProjectCalendarTab({ project }: { project: any }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState("dayGridMonth");
  const calendarRef = useRef<FullCalendar>(null);

  // Flatten and aggregate all events
  const calendarEvents = useMemo(() => {
    const eventsMap = new Map<string, any>();

    // 1. Direct Project Events
    if (project.events) {
      project.events.forEach((evt: any) => {
        eventsMap.set(`evt-${evt.id}`, {
          id: `evt-${evt.id}`,
          title: evt.title,
          start: evt.start,
          end: evt.end,
          allDay: evt.allDay,
          backgroundColor: EVENT_COLORS[evt.type] || "#6b7280",
          borderColor: EVENT_COLORS[evt.type] || "#6b7280",
          extendedProps: { type: evt.type, originalId: evt.id, entityType: "EVENT" }
        });
      });
    }

    // 2. Campaign Events (nested)
    if (project.campaigns) {
      project.campaigns.forEach((camp: any) => {
        // Campaign duration as background events or normal events
        if (camp.startDate) {
          eventsMap.set(`camp-${camp.id}`, {
            id: `camp-${camp.id}`,
            title: `🚀 Launch: ${camp.name}`,
            start: camp.startDate,
            end: camp.endDate || camp.startDate,
            allDay: true,
            backgroundColor: EVENT_COLORS.CAMPAIGN_LAUNCH,
            borderColor: EVENT_COLORS.CAMPAIGN_LAUNCH,
            extendedProps: { type: "CAMPAIGN_LAUNCH", originalId: camp.id, entityType: "CAMPAIGN" }
          });
        }

        // Campaign events
        if (camp.events) {
          camp.events.forEach((evt: any) => {
            eventsMap.set(`evt-${evt.id}`, {
              id: `evt-${evt.id}`,
              title: `${evt.title} (${camp.name})`,
              start: evt.start,
              end: evt.end,
              allDay: evt.allDay,
              backgroundColor: EVENT_COLORS[evt.type] || "#6b7280",
              borderColor: EVENT_COLORS[evt.type] || "#6b7280",
              extendedProps: { type: evt.type, originalId: evt.id, entityType: "EVENT" }
            });
          });
        }
        
        // Campaign tasks
        if (camp.tasks) {
          camp.tasks.forEach((task: any) => {
            if (task.dueDate) {
              eventsMap.set(`task-${task.id}`, {
                id: `task-${task.id}`,
                title: `Task: ${task.title}`,
                start: task.dueDate,
                allDay: true,
                backgroundColor: EVENT_COLORS.TASK,
                borderColor: EVENT_COLORS.TASK,
                extendedProps: { type: "TASK", originalId: task.id, entityType: "TASK" }
              });
            }
          });
        }
      });
    }

    // 3. Project Tasks (merge / overwrite)
    if (project.tasks) {
      project.tasks.forEach((task: any) => {
        if (task.dueDate) {
          eventsMap.set(`task-${task.id}`, {
            id: `task-${task.id}`,
            title: `Task: ${task.title}`,
            start: task.dueDate,
            allDay: true,
            backgroundColor: EVENT_COLORS.TASK,
            borderColor: EVENT_COLORS.TASK,
            extendedProps: { type: "TASK", originalId: task.id, entityType: "TASK" }
          });
        }
      });
    }

    return Array.from(eventsMap.values());
  }, [project]);

  const handleEventClick = (info: any) => {
    const { entityType, originalId } = info.event.extendedProps;
    if (entityType === "TASK") {
      router.push(`/tasks/${originalId}`);
    } else if (entityType === "CAMPAIGN") {
      router.push(`/campaigns/${originalId}`);
    } else {
      // It's an event. Right now we don't have an event page, we can route to project settings or just open a modal.
      // For now, doing nothing or toast. We'll leave it interactive.
      // In a real app, open an Event Modal here.
      console.log("Clicked event:", originalId);
    }
  };

  const changeView = (viewName: string) => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(viewName);
      setActiveView(viewName);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & LEGEND */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl border border-[rgba(0,0,0,0.08)] shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[var(--color-brand-500)]" />
          <h2 className="text-lg font-bold text-gray-900">Unified Project Calendar</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS.TASK }}></span> Tasks</div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS.CAMPAIGN_LAUNCH }}></span> Campaigns</div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS.INSTAGRAM_POST }}></span> Instagram</div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS.CLIENT_MEETING }}></span> Meetings</div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS.INFLUENCER_PHOTOSHOOT }}></span> Shoots</div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS.PAYMENT_REMINDER }}></span> Payments</div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS.DELIVERABLE_DUE }}></span> Deliverables</div>
        </div>
      </div>

      {/* CALENDAR */}
      <PremiumCard className="p-6">
        
        {/* Custom Toolbar instead of FullCalendar default to match our UI */}
        <div className="flex justify-end mb-4">
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
            <Button variant={activeView === "dayGridMonth" ? "secondary" : "ghost"} size="sm" onClick={() => changeView("dayGridMonth")} className={activeView === "dayGridMonth" ? "bg-white shadow-sm" : ""}>Month</Button>
            <Button variant={activeView === "timeGridWeek" ? "secondary" : "ghost"} size="sm" onClick={() => changeView("timeGridWeek")} className={activeView === "timeGridWeek" ? "bg-white shadow-sm" : ""}>Week</Button>
            <Button variant={activeView === "timeGridDay" ? "secondary" : "ghost"} size="sm" onClick={() => changeView("timeGridDay")} className={activeView === "timeGridDay" ? "bg-white shadow-sm" : ""}>Day</Button>
            <Button variant={activeView === "listWeek" ? "secondary" : "ghost"} size="sm" onClick={() => changeView("listWeek")} className={activeView === "listWeek" ? "bg-white shadow-sm" : ""}>Agenda</Button>
          </div>
        </div>

        <div className="h-[750px] calendar-wrapper">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "" // We use our custom toolbar above
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            height="100%"
            dayMaxEvents={4}
            eventContent={(arg) => {
              // Custom rendering for events
              return (
                <div className="px-1.5 py-0.5 text-xs truncate overflow-hidden font-medium cursor-pointer transition-opacity hover:opacity-80 flex items-center gap-1" title={arg.event.title}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: arg.event.backgroundColor || '#000' }}></div>
                  <span className="truncate">{arg.event.title}</span>
                </div>
              );
            }}
          />
        </div>
      </PremiumCard>

      <style dangerouslySetInnerHTML={{__html: `
        .calendar-wrapper .fc {
          --fc-border-color: rgba(0,0,0,0.05);
          --fc-today-bg-color: rgba(99, 102, 241, 0.03);
          --fc-event-bg-color: transparent;
          --fc-event-border-color: transparent;
        }
        .calendar-wrapper .fc-theme-standard td, .calendar-wrapper .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }
        .calendar-wrapper .fc-col-header-cell {
          padding: 12px 0;
          background: rgba(0,0,0,0.01);
          font-weight: 600;
          font-size: 14px;
          color: #374151;
        }
        .calendar-wrapper .fc-daygrid-day-number {
          padding: 8px;
          font-weight: 500;
          color: #6b7280;
        }
        .calendar-wrapper .fc-event {
          border: none !important;
          background: transparent !important;
          margin-top: 2px;
        }
        .calendar-wrapper .fc-h-event .fc-event-main {
          color: #1f2937;
        }
        .calendar-wrapper .fc-button-primary {
          background-color: white !important;
          color: #374151 !important;
          border-color: rgba(0,0,0,0.1) !important;
          text-transform: capitalize !important;
          font-weight: 500 !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        }
        .calendar-wrapper .fc-button-primary:hover {
          background-color: #f9fafb !important;
        }
        .calendar-wrapper .fc-button-active {
          background-color: #f3f4f6 !important;
        }
        .calendar-wrapper .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
        }
      `}} />

    </div>
  );
}
