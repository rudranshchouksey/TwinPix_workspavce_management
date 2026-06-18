"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  entityId
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  entityId?: string;
}) {
  try {
    await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        entityId
      }
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function getNotificationsAction() {
  const user = await requireAuth();
  
  try {
    return await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return []; // Return empty array on DB timeout or error
  }
}

export async function markAsReadAction(id: string) {
  const user = await requireAuth();
  await db.notification.update({
    where: { id, userId: user.id },
    data: { isRead: true }
  });
}

export async function markAllAsReadAction() {
  const user = await requireAuth();
  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true }
  });
}
