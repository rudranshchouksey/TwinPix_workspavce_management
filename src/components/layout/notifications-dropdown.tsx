"use client";

/**
 * components/layout/notifications-dropdown.tsx
 *
 * Topbar bell dropdown — now powered by the shared Zustand store.
 * Receives real-time updates via the SSE stream (no more polling).
 */

import { formatDistanceToNow } from "date-fns";
import { markAsReadAction, markAllAsReadAction } from "@/actions/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckSquare,
  Megaphone,
  Building2,
  FolderKanban,
  MessageSquare,
  CreditCard,
  Sparkles,
  Shield,
  Users,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { useNotificationStore } from "@/store/notification-store";

// ─── Icon + Color Map ─────────────────────────────────────────────
function getIconForType(type: string) {
  const baseType = type.split("_")[0];

  const map: Record<string, { icon: typeof Bell; color: string }> = {
    TASK:       { icon: CheckSquare,   color: "text-emerald-600 bg-emerald-50" },
    CAMPAIGN:   { icon: Megaphone,     color: "text-blue-600 bg-blue-50" },
    CLIENT:     { icon: Building2,     color: "text-amber-600 bg-amber-50" },
    PROJECT:    { icon: FolderKanban,  color: "text-indigo-600 bg-indigo-50" },
    MESSAGE:    { icon: MessageSquare, color: "text-violet-600 bg-violet-50" },
    COMMENT:    { icon: MessageSquare, color: "text-violet-600 bg-violet-50" },
    PAYMENT:    { icon: CreditCard,    color: "text-green-600 bg-green-50" },
    AI:         { icon: Sparkles,      color: "text-fuchsia-600 bg-fuchsia-50" },
    SYSTEM:     { icon: Shield,        color: "text-slate-600 bg-slate-100" },
    INFLUENCER: { icon: Users,         color: "text-rose-600 bg-rose-50" },
    CALENDAR:   { icon: CalendarDays,  color: "text-cyan-600 bg-cyan-50" },
    FILE:       { icon: FolderKanban,  color: "text-cyan-600 bg-cyan-50" },
  };

  return map[baseType] || { icon: Bell, color: "text-gray-400 bg-gray-500/10" };
}

export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead: storeMarkAllAsRead } = useNotificationStore();

  // Show the most recent 10 in the dropdown
  const displayed = notifications.slice(0, 10);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Optimistic update
      markAsRead(id);
      await markAsReadAction(id);
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistic update
      storeMarkAllAsRead();
      await markAllAsReadAction();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-[9px] font-bold text-white ring-2 ring-[var(--color-surface-900)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        }
      />

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-800)] p-0 shadow-xl shadow-black/40"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Notifications
          </span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 rounded-full px-2 text-[10px] font-semibold bg-[var(--color-brand-500)]/15 text-[var(--color-brand-400)] border-0"
              >
                {unreadCount} new
              </Badge>
            )}
            <button
              onClick={handleMarkAllAsRead}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.06)]" />

        <div className="max-h-[320px] overflow-y-auto">
          {displayed.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
              No notifications yet.
            </div>
          ) : (
            displayed.map((notif) => {
              const { icon: NotifIcon, color } = getIconForType(notif.type);
              return (
                <DropdownMenuItem
                  key={notif.id}
                  className={cn(
                    "cursor-pointer rounded-none px-4 py-3 focus:bg-[rgba(0,0,0,0.03)]",
                    !notif.isRead && "bg-[rgba(99,102,241,0.04)]"
                  )}
                  render={<Link href={notif.link || "#"} onClick={() => { if (!notif.isRead) { markAsRead(notif.id); markAsReadAction(notif.id); } }} />}
                >
                    <div className="flex w-full items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}
                      >
                        <NotifIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                            {notif.title}
                            {!notif.isRead && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-500)]" />
                            )}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)] line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--color-text-disabled)]">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notif.id)}
                          className="shrink-0 p-1 text-[var(--color-text-muted)] hover:text-emerald-400 transition-colors rounded"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.06)]" />

        <div className="p-2">
          <Link
            href="/notifications"
            className="flex w-full items-center justify-center rounded-lg py-2 text-xs font-medium text-[var(--color-brand-400)] hover:bg-[rgba(0,0,0,0.04)] transition-colors"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
