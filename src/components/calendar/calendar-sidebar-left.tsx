import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Users, LayoutDashboard, Flag, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EVENT_TYPES } from "./calendar-filters";

export function CalendarSidebarLeft({
  selectedTypes,
  onChange,
  onCreateNew,
  events,
}: {
  selectedTypes: string[];
  onChange: (types: string[]) => void;
  onCreateNew: () => void;
  events?: any[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const toggleType = (id: string) => {
    if (selectedTypes.includes(id)) {
      onChange(selectedTypes.filter((t) => t !== id));
    } else {
      onChange([...selectedTypes, id]);
    }
  };

  return (
    <div className="w-full lg:w-72 shrink-0 space-y-8">
      {/* Mini Calendar */}
      <div className="rounded-2xl border bg-white/60 p-4 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            {format(currentDate, "MMMM yyyy")}
          </h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-[10px] font-medium text-[var(--color-text-muted)]">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isDayToday = isToday(day);
            return (
              <button
                key={i}
                className={cn(
                  "h-8 w-8 rounded-full text-xs flex items-center justify-center mx-auto transition-colors",
                  !isCurrentMonth && "text-transparent pointer-events-none",
                  isCurrentMonth && !isDayToday && "text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--color-text-primary)]",
                  isDayToday && "bg-[var(--color-brand-600)] text-white font-medium shadow-sm shadow-[var(--color-brand-500)]/30"
                )}
              >
                {isCurrentMonth ? format(day, "d") : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] ml-1">
          Quick Actions
        </h3>
        <Button onClick={onCreateNew} className="w-full justify-start rounded-xl shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Event
        </Button>
        <Button variant="outline" className="w-full justify-start rounded-xl border-dashed">
          <Users className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" />
          Find Team Time
        </Button>
      </div>

      {/* Event Categories */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] ml-1">
          Event Categories
        </h3>
        <div className="flex flex-col gap-2">
          {EVENT_TYPES.map((type) => {
            const isSelected = selectedTypes.includes(type.id);
            const count = events?.filter(e => e.type === type.id).length || 0;
            return (
              <button
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left",
                  isSelected
                    ? "bg-white shadow-sm border border-[rgba(0,0,0,0.05)]"
                    : "hover:bg-[rgba(0,0,0,0.03)] text-[var(--color-text-secondary)]"
                )}
              >
                <div
                  className={cn(
                    "h-3.5 w-3.5 rounded-full ring-2 ring-offset-2 ring-transparent transition-all shrink-0",
                    type.color
                  )}
                  style={isSelected ? { boxShadow: `0 0 0 2px white, 0 0 0 4px rgba(0,0,0,0.1)` } : {}}
                />
                <span className={cn("flex-1", isSelected ? "text-[var(--color-text-primary)]" : "")}>
                  {type.label} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pinned Items (Visual Only) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] ml-1">
          Pinned Campaigns
        </h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.03)] cursor-pointer transition-colors text-sm text-[var(--color-text-secondary)]">
            <Pin className="h-3.5 w-3.5 text-blue-500" />
            <span>Summer Collection Launch</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.03)] cursor-pointer transition-colors text-sm text-[var(--color-text-secondary)]">
            <Pin className="h-3.5 w-3.5 text-pink-500" />
            <span>Influencer Meetup NY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
