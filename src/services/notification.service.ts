import { db } from "@/lib/db";
import { notificationBroadcaster } from "@/lib/notification-broadcaster";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

async function triggerEmailProcessor() {
  try {
    fetch(`${getBaseUrl()}/api/emails/process`, { method: "POST" }).catch(() => {});
  } catch (err) {
    // Ignore trigger errors
  }
}

function getEmailTemplateForType(type: NotificationType, payload: CreateNotificationPayload): { templateName: string; emailPayload: any } | null {
  const link = payload.link || "https://twinpix.studio";
  
  // Mapping specific types to templates based on our React Email templates
  if (type === "TASK" || type === "TASK_ASSIGNED") {
    return {
      templateName: "TASK_ASSIGNED",
      emailPayload: { taskTitle: payload.title, assignerName: "Team", link }
    };
  }
  if (type === "CAMPAIGN" || type === "CAMPAIGN_ASSIGNED") {
    return {
      templateName: "CAMPAIGN_ASSIGNED",
      emailPayload: { campaignName: payload.title, role: "Member", link }
    };
  }
  if (type === "MEETING" || type === "CALENDAR") {
    return {
      templateName: "MEETING_REMINDER",
      emailPayload: { meetingTitle: payload.title, meetingTime: "Upcoming", link }
    };
  }
  if (type === "DEADLINE") {
    return {
      templateName: "DEADLINE_REMINDER",
      emailPayload: { itemName: payload.title, dueDate: "Soon", link }
    };
  }
  if (type === "PAYMENT") {
    return {
      templateName: "PAYMENT_REMINDER",
      emailPayload: { amount: "Balance Due", dueDate: "Soon", clientName: "Client", link }
    };
  }
  if (type === "AI" || type === "SUMMARY") {
    return {
      templateName: "AI_DAILY_SUMMARY",
      emailPayload: { date: new Date().toLocaleDateString(), summaryText: payload.message, highlights: [], link }
    };
  }
  
  return null;
}


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
      
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: { email: true, emailPreferences: true }
      });

      if (!user) {
        throw new Error("User not found");
      }

      const notification = await db.notification.create({
        data: {
          ...rest,
          priority: payload.priority || "MEDIUM",
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      // Broadcast to connected SSE clients
      notificationBroadcaster.broadcast(payload.userId, notification);

      // Queue Email if user has preferences enabled for this type and we have a template
      const prefs = (user.emailPreferences as Record<string, boolean>) || {};
      // Default to true if not explicitly disabled for important categories, 
      // or strictly check if true. We'll assume opt-out by default unless set to false.
      const isEnabled = prefs[payload.type] !== false; 

      if (isEnabled) {
        const templateInfo = getEmailTemplateForType(payload.type, payload);
        if (templateInfo) {
          await db.emailDelivery.create({
            data: {
              notificationId: notification.id,
              toEmail: user.email,
              subject: payload.title,
              templateName: templateInfo.templateName,
              payload: templateInfo.emailPayload,
              status: "PENDING",
            }
          });
          // Non-blocking trigger
          triggerEmailProcessor();
        }
      }

      return notification;
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

      const result = await db.notification.createMany({
        data,
      });

      // Broadcast to each user's connected SSE clients.
      // createMany doesn't return records, so we fetch them for broadcast.
      const created = await db.notification.findMany({
        where: {
          userId: { in: userIds },
          title: payload.title,
          message: payload.message,
        },
        orderBy: { createdAt: "desc" },
        take: userIds.length,
      });

      // Fetch users for email info
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, emailPreferences: true }
      });
      const userMap = new Map(users.map(u => [u.id, u]));

      // Queue Emails
      const emailDeliveriesData: any[] = [];
      const templateInfo = getEmailTemplateForType(payload.type, payload as CreateNotificationPayload);

      for (const notification of created) {
        notificationBroadcaster.broadcast(notification.userId, notification);
        
        if (templateInfo) {
          const user = userMap.get(notification.userId);
          if (user) {
            const prefs = (user.emailPreferences as Record<string, boolean>) || {};
            const isEnabled = prefs[payload.type] !== false;
            
            if (isEnabled) {
              emailDeliveriesData.push({
                notificationId: notification.id,
                toEmail: user.email,
                subject: payload.title,
                templateName: templateInfo.templateName,
                payload: templateInfo.emailPayload,
                status: "PENDING",
              });
            }
          }
        }
      }

      if (emailDeliveriesData.length > 0) {
        await db.emailDelivery.createMany({
          data: emailDeliveriesData
        });
        triggerEmailProcessor();
      }

      return result;
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
