import { requireAuth } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";
import { TwinAIPanel } from "@/components/copilot/twin-ai-panel";
import { NotificationStreamProvider } from "@/components/providers/notification-stream-provider";
import { TimeTrackingProvider } from "@/providers/time-tracking-provider";
import { FloatingTimer } from "@/components/time-tracking/floating-timer";
import { db } from "@/lib/db";

/**
 * Dashboard layout — wraps all /app/(dashboard) routes.
 * Server Component: calls requireAuth() — redirects to /login if not authenticated.
 *
 * Layout structure:
 * - Desktop (lg+): fixed sidebar + scrollable main area
 * - Mobile (<lg): topbar hamburger → overlay sidebar
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireAuth();
  
  // Fetch fresh user data to ensure avatar and name are always up-to-date in layout
  const freshUser = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, image: true, role: true }
  });
  
  const user = freshUser || sessionUser;

  return (
    <TimeTrackingProvider>
      <BreadcrumbProvider>
        <NotificationStreamProvider>
          <div className="flex h-dvh w-full overflow-hidden bg-[var(--color-surface-950)]">
          {/* Sidebar (desktop: inline, mobile: overlay via portal) */}
          <Sidebar userRole={user.role} userOverride={user} />

          {/* Main area */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Topbar userOverride={user} />

            <main
              id="main-content"
              className="flex-1 overflow-y-auto p-4 sm:p-6"
            >
              {children}
            </main>
          </div>
        </div>

          <TwinAIPanel />
          <FloatingTimer />
        </NotificationStreamProvider>
      </BreadcrumbProvider>
    </TimeTrackingProvider>
  );
}
