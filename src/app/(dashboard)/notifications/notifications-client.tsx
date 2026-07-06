"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { formatDistanceToNow, isToday, isYesterday, subDays, isAfter } from "date-fns";
import {
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
  archiveNotificationAction,
} from "@/actions/notifications";
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
  Search,
  Filter,
  Archive,
  Trash2,
  Eye,
  X,
  Loader2,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────
type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  priority: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: string | null;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
};

type DateGroup = "Today" | "Yesterday" | "This Week" | "Earlier";

// ─── Constants ────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const NOTIFICATION_TYPES = [
  "All",
  "TASK",
  "CAMPAIGN",
  "CLIENT",
  "PROJECT",
  "MESSAGE",
  "PAYMENT",
  "AI",
  "SYSTEM",
  "INFLUENCER",
  "CALENDAR",
] as const;

const TYPE_LABELS: Record<string, string> = {
  All: "All Types",
  TASK: "Tasks",
  CAMPAIGN: "Campaigns",
  CLIENT: "Clients",
  PROJECT: "Projects",
  MESSAGE: "Messages",
  PAYMENT: "Payments",
  AI: "AI Insights",
  SYSTEM: "System",
  INFLUENCER: "Influencers",
  CALENDAR: "Calendar",
};

// ─── Icon + Color Map ─────────────────────────────────────────────
function getNotificationMeta(type: string) {
  // Normalize: "TASK_ASSIGNED" -> "TASK", "CAMPAIGN_UPDATED" -> "CAMPAIGN" etc.
  const baseType = type.split("_")[0];

  const map: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
    TASK:       { icon: CheckSquare,  color: "text-emerald-600", bg: "bg-emerald-50" },
    CAMPAIGN:   { icon: Megaphone,    color: "text-blue-600",    bg: "bg-blue-50" },
    CLIENT:     { icon: Building2,    color: "text-amber-600",   bg: "bg-amber-50" },
    PROJECT:    { icon: FolderKanban, color: "text-indigo-600",  bg: "bg-indigo-50" },
    MESSAGE:    { icon: MessageSquare,color: "text-violet-600",  bg: "bg-violet-50" },
    COMMENT:    { icon: MessageSquare,color: "text-violet-600",  bg: "bg-violet-50" },
    PAYMENT:    { icon: CreditCard,   color: "text-green-600",   bg: "bg-green-50" },
    AI:         { icon: Sparkles,     color: "text-fuchsia-600", bg: "bg-fuchsia-50" },
    SYSTEM:     { icon: Shield,       color: "text-slate-600",   bg: "bg-slate-100" },
    INFLUENCER: { icon: Users,        color: "text-rose-600",    bg: "bg-rose-50" },
    CALENDAR:   { icon: CalendarDays, color: "text-cyan-600",    bg: "bg-cyan-50" },
    FILE:       { icon: FolderKanban, color: "text-cyan-600",    bg: "bg-cyan-50" },
  };

  return map[baseType] || { icon: Bell, color: "text-[var(--color-text-muted)]", bg: "bg-[rgba(0,0,0,0.04)]" };
}

// ─── Priority Badge ───────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority || priority === "MEDIUM") return null;

  const config: Record<string, { label: string; classes: string; dot?: boolean }> = {
    CRITICAL: {
      label: "Critical",
      classes: "bg-red-50 text-red-700 border-red-200",
      dot: true,
    },
    HIGH: {
      label: "High",
      classes: "bg-orange-50 text-orange-700 border-orange-200",
    },
    LOW: {
      label: "Low",
      classes: "bg-gray-50 text-[var(--color-text-muted)] border-[rgba(0,0,0,0.08)]",
    },
  };

  const c = config[priority];
  if (!c) return null;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", c.classes)}>
      {c.dot && <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>}
      {c.label}
    </span>
  );
}

// ─── Date Grouping Helper ─────────────────────────────────────────
function getDateGroup(date: Date): DateGroup {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  const weekAgo = subDays(new Date(), 7);
  if (isAfter(date, weekAgo)) return "This Week";
  return "Earlier";
}

const DATE_GROUP_ORDER: DateGroup[] = ["Today", "Yesterday", "This Week", "Earlier"];

// ─── Skeleton Loader ──────────────────────────────────────────────
function NotificationSkeleton() {
  return (
    <div className="p-5 flex gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.06)] shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-[rgba(0,0,0,0.06)]" />
        <div className="h-3 w-full rounded bg-[rgba(0,0,0,0.04)]" />
        <div className="h-3 w-1/3 rounded bg-[rgba(0,0,0,0.04)]" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const data = await getNotificationsAction();

      if (append) {
        setNotifications((prev) => {
          const ids = new Set(prev.map((n) => n.id));
          const newOnes = (data as Notification[]).filter((n) => !ids.has(n.id));
          return [...prev, ...newOnes];
        });
      } else {
        setNotifications(data as Notification[]);
      }

      // Since the backend currently uses a fixed limit of 50,
      // we handle "infinite scroll" client-side by paginating the results.
      setHasMore(false); // All data loaded in one call
    } catch (e) {
      console.error("Failed to fetch notifications", e);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Close filter menu on outside click ────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Actions ───────────────────────────────────────────────────
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveNotificationAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success("Notification archived");
    } catch {
      toast.error("Failed to archive notification");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteNotificationAction(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Derived Data ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = notifications;

    if (typeFilter !== "All") {
      result = result.filter((n) => {
        const baseType = n.type.split("_")[0];
        return baseType === typeFilter;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notifications, typeFilter, searchQuery]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // ── Paginated + Grouped ───────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const paginated = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const canLoadMore = visibleCount < filtered.length;

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !canLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && canLoadMore) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canLoadMore]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [typeFilter, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<DateGroup, Notification[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Earlier: [],
    };
    paginated.forEach((n) => {
      const group = getDateGroup(n.createdAt);
      groups[group].push(n);
    });
    return groups;
  }, [paginated]);

  // ── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col">
        {/* Skeleton toolbar */}
        <div className="p-4 border-b border-[rgba(0,0,0,0.06)]">
          <div className="h-8 w-48 rounded-lg bg-[rgba(0,0,0,0.05)] shimmer" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-[rgba(0,0,0,0.04)]">
            <NotificationSkeleton />
          </div>
        ))}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col">
      {/* ─── Toolbar ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-[var(--color-surface-900)]/95 backdrop-blur-sm border-b border-[rgba(0,0,0,0.06)]">
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Left: Unread counter */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[var(--color-brand-500)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Inbox
              </h3>
            </div>
            {unreadCount > 0 && (
              <span className="relative inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[var(--color-brand-500)] text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
                <span className="absolute inset-0 rounded-full bg-[var(--color-brand-500)] animate-ping opacity-20" />
              </span>
            )}
          </div>

          {/* Center: Search */}
          <div className="flex-1 w-full sm:max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-9 rounded-lg border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-950)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-500)]/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Filter + Mark All Read */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Type Filter */}
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-all",
                  typeFilter !== "All"
                    ? "border-[var(--color-brand-400)] bg-[var(--color-brand-500)]/5 text-[var(--color-brand-600)]"
                    : "border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-950)] text-[var(--color-text-secondary)] hover:border-[rgba(0,0,0,0.15)]"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                {TYPE_LABELS[typeFilter] || typeFilter}
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-950)] shadow-lg shadow-black/5 py-1.5 z-50 animate-fade-in-up">
                  {NOTIFICATION_TYPES.map((t) => {
                    const meta = t !== "All" ? getNotificationMeta(t) : null;
                    const Icon = meta?.icon;
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          setTypeFilter(t);
                          setShowFilterMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                          typeFilter === t
                            ? "bg-[var(--color-brand-500)]/8 text-[var(--color-brand-600)] font-medium"
                            : "text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.03)]"
                        )}
                      >
                        {Icon && <Icon className={cn("w-4 h-4", meta?.color)} />}
                        {!Icon && <span className="w-4" />}
                        {TYPE_LABELS[t] || t}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mark All Read */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-9 px-3 text-sm font-medium text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)]/8 transition-all"
              >
                <CheckCheck className="w-4 h-4 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Active filters bar */}
        {(typeFilter !== "All" || searchQuery) && (
          <div className="px-4 pb-3 flex items-center gap-2 text-xs">
            <span className="text-[var(--color-text-muted)]">
              Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
            {typeFilter !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-500)]/8 text-[var(--color-brand-600)] px-2 py-0.5 font-medium">
                {TYPE_LABELS[typeFilter]}
                <button onClick={() => setTypeFilter("All")} className="hover:text-[var(--color-brand-800)] transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(0,0,0,0.05)] text-[var(--color-text-secondary)] px-2 py-0.5 font-medium">
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery("")} className="hover:text-[var(--color-text-primary)] transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Empty States ──────────────────────────────────────── */}
      {notifications.length === 0 ? (
        <div className="p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-brand-100)] flex items-center justify-center mb-5 shadow-sm">
            <Bell className="w-7 h-7 text-[var(--color-brand-400)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            You&apos;re all caught up!
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm">
            No new notifications or activity right now. We&apos;ll alert you here when something happens.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,0,0,0.04)] flex items-center justify-center mb-5">
            <Search className="w-7 h-7 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            No matches found
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm">
            No notifications match your current filters. Try adjusting your search or type filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("All");
            }}
            className="mt-4 text-sm font-medium text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* ─── Grouped Notification List ─────────────────────────── */
        <div className="flex flex-col">
          {DATE_GROUP_ORDER.map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;

            return (
              <div key={group}>
                {/* Group Header */}
                <div className="sticky top-[73px] sm:top-[65px] z-[5] px-5 py-2.5 bg-[var(--color-surface-800)]/80 backdrop-blur-sm border-y border-[rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {group}
                    </span>
                    <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[rgba(0,0,0,0.06)] text-[10px] font-semibold text-[var(--color-text-muted)]">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Notification Rows */}
                <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                  {items.map((n, idx) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      index={idx}
                      isDeleting={deletingId === n.id}
                      onMarkRead={handleMarkAsRead}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* ─── Infinite Scroll Sentinel ───────────────────────── */}
          {canLoadMore && (
            <div ref={sentinelRef} className="p-6 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
            </div>
          )}

          {/* ─── End of List ───────────────────────────────────── */}
          {!canLoadMore && filtered.length > 0 && (
            <div className="p-8 flex flex-col items-center text-center border-t border-[rgba(0,0,0,0.04)]">
              <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center mb-3">
                <CheckCheck className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                You&apos;ve seen all {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Notification Row Component ───────────────────────────────────
function NotificationRow({
  notification: n,
  index,
  isDeleting,
  onMarkRead,
  onArchive,
  onDelete,
}: {
  notification: Notification;
  index: number;
  isDeleting: boolean;
  onMarkRead: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { icon: Icon, color, bg } = getNotificationMeta(n.type);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div
      className={cn(
        "group relative p-5 flex gap-4 transition-all duration-200",
        n.isRead
          ? "hover:bg-[rgba(0,0,0,0.015)]"
          : "bg-[var(--color-brand-500)]/[0.02] hover:bg-[var(--color-brand-500)]/[0.04]",
        isDeleting && "opacity-50 pointer-events-none"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Unread accent bar */}
      {!n.isRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-10 bg-[var(--color-brand-500)] rounded-r-full transition-all" />
      )}

      {/* Icon */}
      <div className={cn("mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", bg)}>
        <Icon className={cn("w-[18px] h-[18px]", color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h4
              className={cn(
                "text-sm font-medium truncate",
                n.isRead ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
              )}
            >
              {n.title}
            </h4>
            <PriorityBadge priority={n.priority} />
          </div>
          <span className="text-[11px] whitespace-nowrap text-[var(--color-text-disabled)] pt-0.5 shrink-0">
            {formatDistanceToNow(n.createdAt, { addSuffix: true })}
          </span>
        </div>

        <p className="text-[13px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
          {n.message}
        </p>

        {n.link && (
          <div className="pt-1">
            <Link
              href={n.link}
              className="inline-flex items-center text-xs font-medium text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] transition-colors"
            >
              View details →
            </Link>
          </div>
        )}
      </div>

      {/* Row Actions (hover reveal) */}
      <div className={cn(
        "flex items-center gap-1 shrink-0 transition-all duration-200",
        "opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0"
      )}>
        {!n.isRead && (
          <button
            onClick={() => onMarkRead(n.id)}
            title="Mark as read"
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onArchive(n.id)}
          title="Archive"
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-amber-600 hover:bg-amber-50 transition-all"
        >
          <Archive className="w-4 h-4" />
        </button>

        {showConfirmDelete ? (
          <div className="flex items-center gap-1 bg-red-50 rounded-lg px-1 py-0.5 border border-red-100">
            <button
              onClick={() => {
                onDelete(n.id);
                setShowConfirmDelete(false);
              }}
              className="p-1.5 rounded text-red-600 hover:bg-red-100 transition-colors text-xs font-semibold"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="p-1.5 rounded text-[var(--color-text-muted)] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmDelete(true)}
            title="Delete"
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
