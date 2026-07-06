/**
 * api/notifications/stream/route.ts
 *
 * SSE (Server-Sent Events) endpoint for real-time notification push.
 * Authenticates via next-auth session cookie, then holds an open
 * text/event-stream connection.
 *
 * The NotificationBroadcaster pushes events into registered controllers.
 * A 30s heartbeat keeps the connection alive through proxies/load balancers.
 */

import { auth } from "@/lib/auth";
import { notificationBroadcaster } from "@/lib/notification-broadcaster";

export const dynamic = "force-dynamic";

export async function GET() {
  // ── Authenticate ──────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  // ── Create SSE stream ─────────────────────────────────────
  let controllerRef: ReadableStreamDefaultController | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;

      // Register this connection
      notificationBroadcaster.register(userId, controller);

      // Send initial connection confirmation
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Heartbeat every 30s to keep the connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Connection closed
          cleanup();
        }
      }, 30_000);
    },
    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    if (controllerRef) {
      notificationBroadcaster.unregister(userId, controllerRef);
      controllerRef = null;
    }
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
