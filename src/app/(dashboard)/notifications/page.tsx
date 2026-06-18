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
        description="View your recent activity, alerts, and mentions across the platform."
      />
      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] overflow-hidden">
        <NotificationsClient />
      </div>
    </div>
  );
}
