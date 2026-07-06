"use server";

import { requireAuth } from "@/lib/auth-utils";
import { NotificationService, CreateNotificationPayload } from "@/services/notification.service";

export async function createNotification(payload: CreateNotificationPayload) {
  try {
    return await NotificationService.createNotification(payload);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function getNotificationsAction() {
  const user = await requireAuth();
  
  try {
    return await NotificationService.getNotifications(user.id, 50);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return []; // Return empty array on DB timeout or error
  }
}

export async function markAsReadAction(id: string) {
  const user = await requireAuth();
  await NotificationService.markAsRead(id, user.id);
}

export async function markAllAsReadAction() {
  const user = await requireAuth();
  await NotificationService.markAllAsRead(user.id);
}
