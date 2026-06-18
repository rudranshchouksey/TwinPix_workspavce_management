"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/actions/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, MessageSquare, FolderKanban, CheckCheck, UploadCloud, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsAction();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markAsReadAction(id);
      await fetchNotifications();
    } catch (e) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadAction();
      await fetchNotifications();
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" };
      case "CAMPAIGN_UPDATED":
        return { icon: FolderKanban, color: "text-blue-400 bg-blue-500/10" };
      case "COMMENT_ADDED":
        return { icon: MessageSquare, color: "text-violet-400 bg-violet-500/10" };
      case "FILE_UPLOADED":
        return { icon: UploadCloud, color: "text-cyan-400 bg-cyan-500/10" };
      default:
        return { icon: Bell, color: "text-gray-400 bg-gray-500/10" };
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
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => {
              const { icon: NotifIcon, color } = getIconForType(notif.type);
              return (
                <DropdownMenuItem
                  key={notif.id}
                  className={cn(
                    "cursor-pointer rounded-none px-4 py-3 focus:bg-[rgba(0,0,0,0.03)]",
                    !notif.isRead && "bg-[rgba(99,102,241,0.04)]"
                  )}
                  render={<Link href={notif.link || "#"} onClick={() => { if (!notif.isRead) markAsReadAction(notif.id) }} />}
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
