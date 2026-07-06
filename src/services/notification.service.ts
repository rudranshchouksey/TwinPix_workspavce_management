import { db } from "@/lib/db";

export type NotificationType = 
  | "TASK" 
  | "CAMPAIGN" 
  | "CLIENT" 
  | "PROJECT" 
  | "MESSAGE" 
  | "PAYMENT" 
  | "AI" 
  | "SYSTEM" 
  | "INFLUENCER" 
  | "CALENDAR"
  | string; // allowing string for backwards compatibility with older types

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  link?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Creates a single notification
   */
  static async createNotification(payload: CreateNotificationPayload) {
    try {
      const { metadata, ...rest } = payload;
      return await db.notification.create({
        data: {
          ...rest,
          priority: payload.priority || "MEDIUM",
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      console.error("[NotificationService] Failed to create notification:", error);
      throw error;
    }
  }

  /**
   * Creates notifications for multiple users
   */
  static async notifyUsers(userIds: string[], payload: Omit<CreateNotificationPayload, "userId">) {
    try {
      const { metadata, ...rest } = payload;
      const data = userIds.map((userId) => ({
        userId,
        ...rest,
        priority: payload.priority || "MEDIUM",
        metadata: metadata ? JSON.stringify(metadata) : null,
      }));

      return await db.notification.createMany({
        data,
      });
    } catch (error) {
      console.error("[NotificationService] Failed to notify users:", error);
      throw error;
    }
  }

  /**
   * Marks a single notification as read
   */
  static async markAsRead(id: string, userId: string) {
    return await db.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  /**
   * Marks all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Archives a notification (For now, just marks as read or could be extended if archive field exists)
   */
  static async archiveNotification(id: string, userId: string) {
    // If there is an isArchived field in the future, update it here.
    // For now, we'll mark as read.
    return await this.markAsRead(id, userId);
  }

  /**
   * Deletes a notification
   */
  static async deleteNotification(id: string, userId: string) {
    return await db.notification.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Gets the unread count for a user
   */
  static async getUnreadCount(userId: string) {
    return await db.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Fetches notifications for a user
   */
  static async getNotifications(userId: string, limit: number = 50) {
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
