import { format, isToday } from "date-fns";
import { Sparkles, Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function CalendarSidebarRight({ events }: { events: any[] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const todaysEvents = events.filter((e) => isToday(new Date(e.start))).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (isCollapsed) {
    return (
      <div className="hidden xl:flex w-12 shrink-0 flex-col items-center py-4 space-y-4 border-l bg-white/30 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} className="h-8 w-8 rounded-full hover:bg-[rgba(0,0,0,0.05)]">
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Calendar className="h-4 w-4" />
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden xl:block w-80 shrink-0 space-y-6 border-l pl-6 pb-6">
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Assistant
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="h-7 w-7 rounded-full hover:bg-[rgba(0,0,0,0.05)] text-[var(--color-text-muted)]">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* AI Suggestions */}
      <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-purple-700 font-semibold mb-3 text-sm">
          <Sparkles className="h-4 w-4" />
          AI Insights
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-white p-3 shadow-sm border border-[rgba(0,0,0,0.04)] text-sm">
            <p className="font-medium text-[var(--color-text-primary)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Low Workload Tomorrow
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              You only have 1 meeting scheduled. Good time for deep work.
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm border border-[rgba(0,0,0,0.04)] text-sm">
            <p className="font-medium text-[var(--color-text-primary)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> Deadline Approaching
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Summer Collection content is due in 3 days.
            </p>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
          Today's Schedule
        </h3>
        {todaysEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgba(0,0,0,0.1)] p-6 text-center text-sm text-[var(--color-text-muted)]">
            No events scheduled for today.
          </div>
        ) : (
          <div className="relative border-l-2 border-[rgba(0,0,0,0.05)] ml-3 space-y-4">
            {todaysEvents.map((event, i) => (
              <div key={event.id || i} className="relative pl-5">
                <div 
                  className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full ring-4 ring-white" 
                  style={{ backgroundColor: event.color || "#3b82f6" }} 
                />
                <div className="rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{event.title}</h4>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(event.start), "h:mm a")} {event.end && `- ${format(new Date(event.end), "h:mm a")}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Approvals */}
      <div className="pt-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-text-muted)]" />
          Pending Approvals
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-[rgba(0,0,0,0.03)] transition-colors cursor-pointer border border-transparent hover:border-[rgba(0,0,0,0.05)]">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Q3 Budget Review</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">Requested by Sarah</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-[rgba(0,0,0,0.03)] transition-colors cursor-pointer border border-transparent hover:border-[rgba(0,0,0,0.05)]">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">New Influencer Brief</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">Requires sign-off</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
