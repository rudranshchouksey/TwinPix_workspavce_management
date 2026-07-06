/**
 * store/notification-store.ts
 *
 * Shared Zustand store for notification state.
 * Consumed by both the topbar dropdown and the /notifications page.
 * Fed by:
 *   1. Initial fetch (getNotificationsAction)
 *   2. Real-time push via SSE (useNotificationStream hook)
 */

import { create } from "zustand";

export type NotificationItem = {
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

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  initialized: boolean;

  // Actions
  setNotifications: (items: NotificationItem[]) => void;
  addNotification: (item: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setInitialized: (v: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  initialized: false,

  setNotifications: (items) => {
    set({
      notifications: items,
      unreadCount: items.filter((n) => !n.isRead).length,
      initialized: true,
    });
  },

  addNotification: (item) => {
    const { notifications } = get();
    // Deduplicate by id
    if (notifications.some((n) => n.id === item.id)) return;

    const updated = [item, ...notifications];
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.isRead).length,
    });
  },

  markAsRead: (id) => {
    const { notifications } = get();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.isRead).length,
    });
  },

  markAllAsRead: () => {
    const { notifications } = get();
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    set({
      notifications: updated,
      unreadCount: 0,
    });
  },

  removeNotification: (id) => {
    const { notifications } = get();
    const updated = notifications.filter((n) => n.id !== id);
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.isRead).length,
    });
  },

  setInitialized: (v) => set({ initialized: v }),
}));
