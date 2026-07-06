/**
 * lib/notification-broadcaster.ts
 *
 * In-process singleton that manages SSE connections for real-time notifications.
 * Each authenticated user can have multiple connections (multiple tabs/devices).
 *
 * Usage (server-side only):
 *   import { notificationBroadcaster } from "@/lib/notification-broadcaster";
 *   notificationBroadcaster.broadcast(userId, notificationData);
 *
 * NOTE: This is a single-instance solution. If TwinPix Studio scales to multiple
 * server instances, replace with Redis Pub/Sub or similar cross-process transport.
 */

type NotificationPayload = {
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

class NotificationBroadcaster {
  // Map<userId, Set<ReadableStreamDefaultController>>
  private connections = new Map<string, Set<ReadableStreamDefaultController>>();

  /**
   * Register a new SSE connection for a user.
   */
  register(userId: string, controller: ReadableStreamDefaultController) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(controller);
  }

  /**
   * Remove a connection when a client disconnects.
   */
  unregister(userId: string, controller: ReadableStreamDefaultController) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(controller);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * Broadcast a notification to all connected tabs/devices for a user.
   * Silently drops if the user has no active connections.
   */
  broadcast(userId: string, notification: NotificationPayload) {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) return;

    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify(notification)}\n\n`;
    const encoded = encoder.encode(data);

    for (const controller of userConnections) {
      try {
        controller.enqueue(encoded);
      } catch {
        // Controller is closed / errored — clean up
        userConnections.delete(controller);
      }
    }

    // Clean up empty sets
    if (userConnections.size === 0) {
      this.connections.delete(userId);
    }
  }

  /**
   * Get the number of active connections (for debugging / monitoring).
   */
  getConnectionCount(userId?: string): number {
    if (userId) {
      return this.connections.get(userId)?.size ?? 0;
    }
    let total = 0;
    for (const conns of this.connections.values()) {
      total += conns.size;
    }
    return total;
  }
}

// ── Singleton ──────────────────────────────────────────────────
// Use globalThis to survive HMR in development (Next.js re-imports modules on each request).
const globalForBroadcaster = globalThis as unknown as {
  notificationBroadcaster?: NotificationBroadcaster;
};

export const notificationBroadcaster =
  globalForBroadcaster.notificationBroadcaster ?? new NotificationBroadcaster();

if (process.env.NODE_ENV !== "production") {
  globalForBroadcaster.notificationBroadcaster = notificationBroadcaster;
}
