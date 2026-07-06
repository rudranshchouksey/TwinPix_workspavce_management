/**
 * hooks/use-notification-stream.ts
 *
 * Custom hook that opens an EventSource (SSE) connection to
 * /api/notifications/stream and pushes incoming notifications
 * into the shared Zustand store.
 *
 * Also handles:
 *   - Initial fetch to populate the store on first mount
 *   - Toast notifications for new real-time arrivals
 *   - Auto-reconnection (native EventSource behavior + backoff guard)
 *   - Cleanup on unmount
 */

"use client";

import { useEffect, useRef } from "react";
import { useNotificationStore, type NotificationItem } from "@/store/notification-store";
import { getNotificationsAction } from "@/actions/notifications";
import { toast } from "sonner";

export function useNotificationStream() {
  const { addNotification, setNotifications, initialized } = useNotificationStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  // ── Initial fetch ───────────────────────────────────────────
  useEffect(() => {
    if (initialized) return;

    async function loadInitial() {
      try {
        const data = await getNotificationsAction();
        if (mountedRef.current) {
          setNotifications(data as NotificationItem[]);
        }
      } catch (e) {
        console.error("[useNotificationStream] Initial fetch failed:", e);
      }
    }

    loadInitial();
  }, [initialized, setNotifications]);

  // ── SSE connection ──────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      // Don't open duplicate connections
      if (eventSourceRef.current) return;

      const es = new EventSource("/api/notifications/stream");
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const notification = JSON.parse(event.data) as NotificationItem;

          // Ensure createdAt is a Date object
          notification.createdAt = new Date(notification.createdAt);

          addNotification(notification);

          // Show a toast for new notifications
          toast(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        } catch (e) {
          console.error("[useNotificationStream] Failed to parse SSE message:", e);
        }
      };

      es.onerror = () => {
        // EventSource auto-reconnects, but close the broken one first
        es.close();
        eventSourceRef.current = null;

        // Retry after 3 seconds if still mounted
        if (mountedRef.current) {
          setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, 3000);
        }
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [addNotification]);
}
