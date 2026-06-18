import { Suspense } from "react";
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

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataLoader userName={user.name ?? undefined} userRole={user.role} />
    </Suspense>
  );
}

async function DashboardDataLoader({ userName, userRole }: { userName?: string, userRole: string }) {
  const activities = await getActivityLogsAction(10);
  return <DashboardContent userName={userName} userRole={userRole} activities={activities} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 bg-stone-100 rounded-lg"></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-stone-100 rounded-2xl"></div>
        ))}
      </div>
      <div className="h-64 bg-stone-100 rounded-2xl"></div>
    </div>
  );
}
