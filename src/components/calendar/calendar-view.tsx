"use client";

import { useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { EventDialog } from "./event-dialog";
import { EventDrawer } from "./event-drawer";
import { EVENT_TYPES } from "./calendar-filters";
import { updateEventAction, deleteEventAction } from "@/actions/calendar";
import { toast } from "sonner";
import { CalendarSidebarLeft } from "./calendar-sidebar-left";
import { CalendarSidebarRight } from "./calendar-sidebar-right";
import { CalendarDashboardCards } from "./calendar-dashboard-cards";
import { CalendarHero } from "./calendar-hero";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Users, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import "./calendar.css"; // Optional overrides for styling

export function CalendarView({ initialEvents }: { initialEvents: any[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [selectedTypes, setSelectedTypes] = useState(EVENT_TYPES.map((t) => t.id));
  
  // Modals/Drawers state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  const calendarRef = useRef<FullCalendar>(null);
  const [viewMode, setViewMode] = useState("dayGridMonth");

  // Filter events before passing to FullCalendar
  const filteredEvents = events.filter((e) => selectedTypes.includes(e.type)).map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: e.color || "#3b82f6",
    borderColor: "transparent",
    textColor: "#ffffff",
    extendedProps: { ...e },
  }));

  const handleDateSelect = (selectInfo: any) => {
    setSelectedEvent({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
    });
    setIsCreateOpen(true);
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event.extendedProps);
    setIsDrawerOpen(true);
  };

  const handleEventDrop = async (dropInfo: any) => {
    try {
      const updated = await updateEventAction(dropInfo.event.id, {
        start: dropInfo.event.start,
        end: dropInfo.event.end,
        allDay: dropInfo.event.allDay,
      });
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
    setIsCreateOpen(true);
  };

  const refreshEvents = () => {
    window.location.reload(); 
  };

  const handleDelete = async () => {
    if (!selectedEvent?.id) return;
    try {
      await deleteEventAction(selectedEvent.id);
      toast.success("Event deleted");
      refreshEvents();
    } catch (e) {
      toast.error("Failed to delete event");
    }
  };

  // Custom Header Controls
  const goPrev = () => calendarRef.current?.getApi().prev();
  const goNext = () => calendarRef.current?.getApi().next();
  const goToday = () => calendarRef.current?.getApi().today();
  
  const changeView = (view: string) => {
    setViewMode(view);
    calendarRef.current?.getApi().changeView(view);
  };

  const currentTitle = calendarRef.current?.getApi().view.title || format(new Date(), "MMMM yyyy");

  // Premium Event Render
  const renderEventContent = (eventInfo: any) => {
    const isList = viewMode.includes("list");
    
    if (isList) {
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: eventInfo.event.backgroundColor }} />
          <span className="font-medium">{eventInfo.event.title}</span>
        </div>
      );
    }

    return (
      <div className="w-full flex items-center overflow-hidden px-1.5 py-0.5 rounded-md shadow-sm opacity-95 transition-opacity hover:opacity-100 gap-1.5">
        <span className="truncate text-xs font-semibold leading-tight">{eventInfo.event.title}</span>
        {eventInfo.event.extendedProps.type === 'MEETING' && <Users className="h-2.5 w-2.5 ml-auto shrink-0 opacity-80" />}
        {eventInfo.event.extendedProps.type === 'TASK' && <CheckCircle2 className="h-2.5 w-2.5 ml-auto shrink-0 opacity-80" />}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <CalendarHero onCreateClick={handleCreateNew} />
      <CalendarDashboardCards />

      <div className="flex flex-col lg:flex-row gap-6">
        <CalendarSidebarLeft 
          selectedTypes={selectedTypes} 
          onChange={setSelectedTypes} 
          onCreateNew={handleCreateNew} 
        />

        <div className="flex-1 flex flex-col min-w-0 bg-white/60 backdrop-blur-md border border-[rgba(0,0,0,0.06)] rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Custom Calendar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] w-48">
                {currentTitle}
              </h2>
              <div className="flex items-center rounded-xl border bg-white p-0.5 shadow-sm">
                <Button variant="ghost" size="icon" onClick={goPrev} className="h-8 w-8 rounded-lg hover:bg-[rgba(0,0,0,0.03)]">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={goToday} className="h-8 px-3 rounded-lg hover:bg-[rgba(0,0,0,0.03)] text-sm font-medium">
                  Today
                </Button>
                <Button variant="ghost" size="icon" onClick={goNext} className="h-8 w-8 rounded-lg hover:bg-[rgba(0,0,0,0.03)]">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="inline-flex items-center rounded-xl border bg-white p-1 shadow-sm">
              {[
                { id: "dayGridMonth", label: "Month" },
                { id: "timeGridWeek", label: "Week" },
                { id: "timeGridDay", label: "Day" },
                { id: "listWeek", label: "Agenda" },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => changeView(view.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                    viewMode === view.id 
                      ? "bg-[rgba(0,0,0,0.05)] text-[var(--color-text-primary)] shadow-sm" 
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.02)]"
                  )}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          {/* FullCalendar Grid */}
          <div className="flex-1 min-h-[600px] xl:min-h-[700px] overflow-hidden calendar-premium-wrapper">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              headerToolbar={false} // We use our custom header
              initialView="dayGridMonth"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={3}
              weekends={true}
              events={filteredEvents}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              height="100%"
              eventContent={renderEventContent}
              eventClassNames="premium-event-capsule"
              dayCellClassNames="premium-day-cell"
            />
          </div>
        </div>

        <CalendarSidebarRight events={filteredEvents} />
      </div>

      {/* Modals & Drawers */}
      <EventDialog
        isOpen={isCreateOpen}
        setIsOpen={setIsCreateOpen}
        eventData={selectedEvent}
        isEdit={false}
        onSaveSuccess={refreshEvents}
      />

      <EventDialog
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
        eventData={selectedEvent}
        isEdit={true}
        onSaveSuccess={refreshEvents}
      />

      <EventDrawer
        isOpen={isDrawerOpen}
        setIsOpen={setIsDrawerOpen}
        eventData={selectedEvent}
        onEdit={() => {
          setIsDrawerOpen(false);
          setIsEditOpen(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
