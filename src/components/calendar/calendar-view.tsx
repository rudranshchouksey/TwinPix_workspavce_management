"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventDialog } from "./event-dialog";
import { CalendarFilters, EVENT_TYPES } from "./calendar-filters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { updateEventAction } from "@/actions/calendar";
import { toast } from "sonner";
import "./calendar.css"; // Optional overrides for styling

export function CalendarView({ initialEvents }: { initialEvents: any[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [selectedTypes, setSelectedTypes] = useState(EVENT_TYPES.map((t) => t.id));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Filter events before passing to FullCalendar
  const filteredEvents = events.filter((e) => selectedTypes.includes(e.type)).map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: e.color || "#3b82f6",
    borderColor: e.color || "#3b82f6",
    extendedProps: { ...e },
  }));

  const handleDateSelect = (selectInfo: any) => {
    setSelectedEvent({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
    });
    setIsDialogOpen(true);
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event.extendedProps);
    setIsDialogOpen(true);
  };

  const handleEventDrop = async (dropInfo: any) => {
    try {
      const updated = await updateEventAction(dropInfo.event.id, {
        start: dropInfo.event.start,
        end: dropInfo.event.end,
        allDay: dropInfo.event.allDay,
      });
      // Update local state
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Event rescheduled");
    } catch (e) {
      dropInfo.revert();
      toast.error("Failed to reschedule event");
    }
  };

  const handleEventResize = async (resizeInfo: any) => {
    try {
      const updated = await updateEventAction(resizeInfo.event.id, {
        end: resizeInfo.event.end,
      });
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Event duration updated");
    } catch (e) {
      resizeInfo.revert();
      toast.error("Failed to update duration");
    }
  };

  const handleCreateNew = () => {
    setSelectedEvent(null);
    setIsDialogOpen(true);
  };

  const refreshEvents = async () => {
    // We can refetch or just let server actions revalidatePath handle it 
    // if this component re-renders. Since it's a client component, 
    // a page reload or router.refresh() might be needed, but we can also 
    // just use a server action to refetch here.
    window.location.reload(); // Simple approach for now
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-6">
        <Button onClick={handleCreateNew} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
        <CalendarFilters selectedTypes={selectedTypes} onChange={setSelectedTypes} />
      </div>

      {/* Main Calendar */}
      <div className="flex-1 bg-card border rounded-xl p-4 shadow-sm min-h-[600px] overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={filteredEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="100%"
        />
      </div>

      <EventDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        eventData={selectedEvent}
        isEdit={!!selectedEvent?.id}
        onSaveSuccess={refreshEvents}
      />
    </div>
  );
}
