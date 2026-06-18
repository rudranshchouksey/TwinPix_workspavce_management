"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/actions/notifications";
import { Bell, CheckCircle2, MessageSquare, FolderKanban, UploadCloud, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsAction();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
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

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--color-text-muted)]">
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-[var(--color-text-muted)] opacity-50" />
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">You're all caught up!</h3>
        <p className="text-[var(--color-text-secondary)] mt-2 max-w-sm">
          No new notifications or activity right now. We'll alert you here when something happens.
        </p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b border-[rgba(0,0,0,0.08)] flex items-center justify-between bg-[rgba(0,0,0,0.02)]">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          {unreadCount > 0 ? `${unreadCount} unread notifications` : "All read"}
        </span>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            className="text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] hover:bg-[var(--color-brand-500)]/10"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="divide-y divide-[rgba(0,0,0,0.05)]">
        {notifications.map((n) => {
          const { icon: Icon, color } = getIconForType(n.type);
          
          return (
            <div 
              key={n.id} 
              className={cn(
                "p-5 flex gap-4 transition-colors relative",
                n.isRead ? "hover:bg-[rgba(0,0,0,0.02)]" : "bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.06)]"
              )}
            >
              {!n.isRead && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-[var(--color-brand-500)] rounded-r-full" />
              )}
              
              <div className={cn("mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0", color)}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <h4 className={cn("text-base font-medium", n.isRead ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]")}>
                    {n.title}
                  </h4>
                  <span className="text-xs whitespace-nowrap text-[var(--color-text-muted)] pt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {n.message}
                </p>
                {n.link && (
                  <div className="pt-2">
                    <Link 
                      href={n.link}
                      className="text-sm font-medium text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] hover:underline"
                    >
                      View details
                    </Link>
                  </div>
                )}
              </div>

              {!n.isRead && (
                <div className="flex items-center pl-4 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleMarkAsRead(n.id)}
                    className="h-8 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.1)]"
                  >
                    Mark read
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
