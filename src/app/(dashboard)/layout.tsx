import { requireAuth } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";
import { TwinAIPanel } from "@/components/copilot/twin-ai-panel";
import { NotificationStreamProvider } from "@/components/providers/notification-stream-provider";

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
  const user = await requireAuth();

  return (
    <BreadcrumbProvider>
      <NotificationStreamProvider>
        <div className="flex h-dvh w-full overflow-hidden bg-[var(--color-surface-950)]">
          {/* Sidebar (desktop: inline, mobile: overlay via portal) */}
          <Sidebar userRole={user.role} />

          {/* Main area */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Topbar />

            <main
              id="main-content"
              className="flex-1 overflow-y-auto p-4 sm:p-6"
            >
              {children}
            </main>
          </div>
        </div>

        <TwinAIPanel />
      </NotificationStreamProvider>
    </BreadcrumbProvider>
  );
}
