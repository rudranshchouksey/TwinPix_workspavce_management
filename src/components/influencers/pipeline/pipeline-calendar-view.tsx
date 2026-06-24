"use client";

import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { updateEventAction } from "@/actions/calendar";
import { toast } from "sonner";
import "@/components/calendar/calendar.css";

export function PipelineCalendarView({ events }: { events: any[] }) {
  const router = useRouter();

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    editable: e.editable,
    backgroundColor: e.color,
    borderColor: e.color,
    extendedProps: e.extendedProps,
  }));

  const handleEventDrop = async (dropInfo: any) => {
    if (dropInfo.event.extendedProps.kind !== "EVENT") {
      dropInfo.revert();
      return;
    }
    try {
      await updateEventAction(dropInfo.event.id, { start: dropInfo.event.start, end: dropInfo.event.end, allDay: dropInfo.event.allDay });
      toast.success("Rescheduled");
      router.refresh();
    } catch {
      dropInfo.revert();
      toast.error("Failed to reschedule");
    }
  };

  const handleEventClick = (clickInfo: any) => {
    const influencerId = clickInfo.event.extendedProps?.influencer?.id;
    const campaignId = clickInfo.event.extendedProps?.campaignId;
    if (influencerId) router.push(`/influencers/${influencerId}`);
    else if (campaignId) router.push(`/campaigns/${campaignId}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[11px] font-bold text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#7c3aed]" /> Meetings &amp; Events</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Campaign Deadlines</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ef4444]" /> Overdue Follow-Up</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#0ea5e9]" /> Follow-Up Due</span>
      </div>
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm min-h-[600px]">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth" }}
          initialView="dayGridMonth"
          editable={true}
          dayMaxEvents={true}
          events={calendarEvents}
          eventDrop={handleEventDrop}
          eventClick={handleEventClick}
          height="650px"
        />
      </div>
    </div>
  );
}
