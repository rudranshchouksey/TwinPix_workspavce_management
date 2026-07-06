import { Metadata } from "next";
import { getCalendarDashboardDataAction } from "@/actions/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";
import { requireAuth } from "@/lib/auth-utils";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Calendar & Scheduling | TwinPix Workspace",
  description: "Manage timelines, deliverables, and team schedules.",
};

export default async function CalendarPage() {
  await requireAuth();

  const dashboardData = await getCalendarDashboardDataAction();

  return <CalendarView dashboardData={dashboardData} />;
}
