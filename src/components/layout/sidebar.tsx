"use client";

/**
 * components/layout/sidebar.tsx
 *
 * Premium collapsible sidebar with:
 * - Desktop: collapsible width with Framer Motion
 * - Mobile: overlay sheet with backdrop blur
 * - Zustand-persisted collapse state
 * - Role-based navigation
 * - User profile section
 */

import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/hooks/use-sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/rbac";

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (email?.[0] ?? "U").toUpperCase();
}

// ─── Sidebar Content (shared between desktop and mobile) ─────

function SidebarContent({
  isCollapsed,
  userRole,
  onNavigate,
}: {
  isCollapsed: boolean;
  userRole?: string;
  onNavigate?: () => void;
}) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <>
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav
          isCollapsed={isCollapsed}
          userRole={userRole ?? user?.role}
          onNavigate={onNavigate}
        />
      </div>

      {/* User Profile */}
      <div className="shrink-0 border-t border-[var(--color-border)] p-3">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex cursor-default justify-center">
                <Avatar className="h-8 w-8 ring-1 ring-[var(--color-border)]">
                  <AvatarImage src={user?.image ?? undefined} />
                  <AvatarFallback className="bg-[var(--color-brand-100)] text-[var(--color-brand-600)] text-xs font-semibold">
                    {getInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[var(--color-surface-950)] text-[var(--color-text-primary)] border-[var(--color-border)] shadow-sm">
              <p className="font-medium">{user?.name ?? user?.email}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {getRoleLabel(user?.role ?? "")}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--color-surface-900)] transition-colors cursor-default">
            <Avatar className="h-9 w-9 shrink-0 ring-1 ring-[var(--color-border)] shadow-sm">
              <AvatarImage src={user?.image ?? undefined} />
              <AvatarFallback className="bg-[var(--color-brand-100)] text-[var(--color-brand-600)] text-xs font-bold">
                {getInitials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                {user?.name ?? "Team Member"}
              </p>
              <p className="truncate text-xs text-[var(--color-text-muted)] font-medium">
                {getRoleLabel(user?.role ?? "")}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Desktop Sidebar ─────────────────────────────────────────

function DesktopSidebar({ userRole }: { userRole?: string }) {
  const { isCollapsed, toggle } = useSidebar();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative hidden h-[calc(100dvh-24px)] flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-950)] shadow-sm lg:flex m-3 overflow-hidden shrink-0"
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-[var(--topbar-height)] shrink-0 items-center border-b border-[var(--color-border)] px-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm shadow-[var(--color-brand-500)]/20">
            <img
              src="/logo.png"
              alt="TwinPix Studio"
              className="h-6 w-6 object-contain"
            />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="truncate text-base font-bold tracking-tight text-[var(--color-text-primary)]"
              >
                TwinPix Workspace
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={toggle}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "absolute -right-3 top-[72px] z-10 flex h-6 w-6 items-center justify-center rounded-full",
                "border border-[var(--color-border)] bg-[var(--color-surface-950)]",
                "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                "hover:bg-[var(--color-surface-900)] transition-all duration-200",
                "shadow-sm"
              )}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-3 w-3" />
              ) : (
                <PanelLeftClose className="h-3 w-3" />
              )}
            </button>
          }
        />
        <TooltipContent side="right">
          {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </TooltipContent>
      </Tooltip>

      <SidebarContent isCollapsed={isCollapsed} userRole={userRole} />
    </motion.aside>
  );
}

// ─── Mobile Sidebar Overlay ──────────────────────────────────

function MobileSidebar({ userRole }: { userRole?: string }) {
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={closeMobile}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-950)] shadow-2xl lg:hidden"
          >
            {/* Header */}
            <div className="flex h-[var(--topbar-height)] items-center justify-between border-b border-[var(--color-border)] px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm shadow-[var(--color-brand-500)]/20">
                  <img
                    src="/logo.png"
                    alt="TwinPix Studio"
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <span className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
                  TwinPix Workspace
                </span>
              </div>
              <button
                onClick={closeMobile}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-900)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close sidebar</span>
              </button>
            </div>

            <SidebarContent
              isCollapsed={false}
              userRole={userRole}
              onNavigate={closeMobile}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Exported Sidebar ────────────────────────────────────────

export function Sidebar({ userRole }: { userRole?: string }) {
  return (
    <>
      <DesktopSidebar userRole={userRole} />
      <MobileSidebar userRole={userRole} />
    </>
  );
}
