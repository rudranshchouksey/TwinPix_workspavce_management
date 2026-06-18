import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getActivityLogsAction } from "@/actions/activity";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "TwinPix Studio workspace overview and insights.",
};

export default async function DashboardPage() {
  const user = await requireAuth();
  const activities = await getActivityLogsAction(10);

  return (
    <DashboardContent
      userName={user.name ?? undefined}
      userRole={user.role}
      activities={activities}
    />
  );
}
