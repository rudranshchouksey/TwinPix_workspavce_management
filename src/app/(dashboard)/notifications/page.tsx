import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { SectionHeader } from "@/components/dashboard/section-header";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications",
  description: "View all your notifications and activities.",
};

export default async function NotificationsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <SectionHeader 
        label="Notifications" 
        description="Stay on top of tasks, campaigns, and activity across the platform."
      />
      <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[var(--color-surface-900)] overflow-hidden shadow-sm">
        <NotificationsClient />
      </div>
    </div>
  );
}
