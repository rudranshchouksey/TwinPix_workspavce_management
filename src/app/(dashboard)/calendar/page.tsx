import { Metadata } from "next";
import { getEventsAction } from "@/actions/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";
import { requireAuth } from "@/lib/auth-utils";
import { SectionHeader } from "@/components/dashboard/section-header";

export const metadata: Metadata = {
  title: "Calendar & Scheduling | TwinPix Studio",
  description: "Manage campaigns, tasks, and team meetings.",
};

export default async function CalendarPage() {
  await requireAuth();

  const events = await getEventsAction();

  return (
    <div className="space-y-6">
      <SectionHeader 
        label="Calendar & Scheduling" 
        description="Manage your team's deadlines, meetings, and content schedules."
      />

      <CalendarView initialEvents={events} />
    </div>
  );
}
