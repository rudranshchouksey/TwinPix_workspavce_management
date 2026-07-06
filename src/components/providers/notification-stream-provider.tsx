/**
 * components/providers/notification-stream-provider.tsx
 *
 * Thin client component that activates the SSE notification stream.
 * Place in the dashboard layout so the connection is active whenever
 * the user is logged in.
 */

"use client";

import { useNotificationStream } from "@/hooks/use-notification-stream";

export function NotificationStreamProvider({ children }: { children: React.ReactNode }) {
  useNotificationStream();
  return <>{children}</>;
}
