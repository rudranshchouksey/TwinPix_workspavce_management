import { Metadata } from "next";
import { getEventsAction } from "@/actions/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";
import { requireAuth } from "@/lib/auth-utils";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Calendar & Scheduling | TwinPix Studio",
  description: "Manage campaigns, tasks, and team meetings.",
};

export default async function CalendarPage() {
  await requireAuth();

  const events = await getEventsAction();

  return <CalendarView initialEvents={events} />;
}
