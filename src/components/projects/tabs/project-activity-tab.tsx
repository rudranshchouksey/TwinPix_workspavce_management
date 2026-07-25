import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { format } from "date-fns";
import { Activity } from "lucide-react";

export function ProjectActivityTab({ project }: { project: any }) {
  const activities: any[] = [];

  (project.campaigns || []).forEach((c: any) => {
    (c.activities || []).forEach((a: any) => {
      activities.push({ ...a, sourceName: `Campaign: ${c.name}` });
    });
  });

  (project.tasks || []).forEach((t: any) => {
    (t.activities || []).forEach((a: any) => {
      activities.push({ ...a, sourceName: `Task: ${t.title}` });
    });
  });

  const sortedActivities = activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (sortedActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-16 text-center">
        <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4">
          <Activity className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No activity</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Activity from campaigns and tasks will appear here.</p>
      </div>
    );
  }

  return (
    <PremiumCard className="p-6">
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[rgba(0,0,0,0.1)] before:to-transparent">
        {sortedActivities.map((activity, index) => (
          <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--color-surface-950)] bg-[var(--color-brand-100)] text-[var(--color-brand-500)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <Activity className="w-4 h-4" />
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-[rgba(0,0,0,0.02)] shadow-sm">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--color-brand-500)] mb-1 uppercase tracking-wider">{activity.sourceName}</span>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{activity.details}</p>
                <time className="text-xs text-[var(--color-text-muted)] mt-2 font-medium">{format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}</time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}
