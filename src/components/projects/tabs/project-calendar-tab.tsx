import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { Calendar as CalendarIcon } from "lucide-react";

export function ProjectCalendarTab({ project }: { project: any }) {
  // We'll render a simple list view for now to avoid large dependencies if not fully configured.
  // Aggregating events
  const upcomingEvents: any[] = [];
  
  (project.campaigns || []).forEach((c: any) => {
    if (c.startDate) upcomingEvents.push({ title: `${c.name} Start`, date: c.startDate, type: 'Campaign' });
    if (c.endDate) upcomingEvents.push({ title: `${c.name} End`, date: c.endDate, type: 'Campaign' });
  });

  (project.tasks || []).forEach((t: any) => {
    if (t.dueDate) upcomingEvents.push({ title: t.title, date: t.dueDate, type: 'Task Deadline' });
  });

  const sortedEvents = upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-16 text-center">
        <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4">
          <CalendarIcon className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No events scheduled</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Set dates on campaigns and tasks to see them here.</p>
      </div>
    );
  }

  return (
    <PremiumCard className="p-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Upcoming Schedule</h3>
      <div className="space-y-0">
        {sortedEvents.map((event, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.02)] transition-colors last:border-0">
            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.05)]">
              <span className="text-xs font-bold text-red-500 uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
              <span className="text-xl font-bold text-[var(--color-text-primary)]">{new Date(event.date).getDate()}</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit bg-[var(--color-brand-100)] text-[var(--color-brand-600)] mb-1">
                {event.type}
              </span>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)]">{event.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}
