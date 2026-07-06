import { db } from "@/lib/db";
import { notificationBroadcaster } from "@/lib/notification-broadcaster";
import { WhatsAppService, getWhatsAppTemplateForType } from "./whatsapp.service";

const NOTIFICATION_DEFAULTS_KEY = "NOTIFICATION_DEFAULTS";

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

function getCategoryForType(type: string) {
  if (type.includes("CAMPAIGN")) return "CAMPAIGN";
  if (type.includes("TASK")) return "TASK";
  if (type.includes("MEETING") || type === "CALENDAR") return "MEETING";
  if (type.includes("PAYMENT") || type.includes("INVOICE")) return "PAYMENT";
  if (type.includes("PROJECT")) return "PROJECT";
  if (type.includes("AI") || type === "SUMMARY") return "AI";
  return "SYSTEM"; // Default catch-all
}

function isChannelEnabled(userPrefs: any, defaultPrefs: any, channel: string, category: string) {
  // First check user explicit preference
  if (userPrefs && typeof userPrefs[category] === "boolean") {
    return userPrefs[category];
  }
  // Fallback to admin default
  if (defaultPrefs && defaultPrefs[channel] && typeof defaultPrefs[channel][category] === "boolean") {
    return defaultPrefs[channel][category];
  }
  // Hardcoded fallback (true by default to ensure notifications go out unless opted out)
  return true;
}

function getEmailTemplateForType(type: NotificationType, payload: CreateNotificationPayload): { templateName: string; emailPayload: any } | null {
  const link = payload.link || "https://twinpix.studio";
  
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
  | string;

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
        select: { 
          email: true, 
          emailPreferences: true, 
          phoneNumber: true, 
          whatsappPreferences: true,
          inAppPreferences: true,
          pushPreferences: true
        }
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Fetch global defaults
      const defaultSetting = await db.systemSetting.findUnique({ where: { key: NOTIFICATION_DEFAULTS_KEY } });
      const defaultPrefs = (defaultSetting?.value as any) || {};
      const category = getCategoryForType(payload.type);

      const notification = await db.notification.create({
        data: {
          ...rest,
          priority: payload.priority || "MEDIUM",
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      // 1. In-App Delivery
      const inAppEnabled = isChannelEnabled(user.inAppPreferences, defaultPrefs, "inApp", category);
      if (inAppEnabled) {
        notificationBroadcaster.broadcast(payload.userId, notification);
      }

      // 2. Email Delivery Queue
      const emailEnabled = isChannelEnabled(user.emailPreferences, defaultPrefs, "email", category);
      if (emailEnabled) {
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

      // 3. WhatsApp Delivery Queue
      const waEnabled = isChannelEnabled(user.whatsappPreferences, defaultPrefs, "whatsapp", category);
      if (waEnabled && user.phoneNumber) {
        const waTemplateInfo = getWhatsAppTemplateForType(payload.type, payload as CreateNotificationPayload);
        if (waTemplateInfo) {
          const waDelivery = await db.whatsAppDelivery.create({
            data: {
              notificationId: notification.id,
              toPhone: user.phoneNumber,
              messageType: waTemplateInfo.messageType,
              templateName: waTemplateInfo.templateName,
              content: waTemplateInfo.content,
              status: "PENDING",
            }
          });
          // Process asynchronously
          WhatsAppService.processDelivery(waDelivery.id).catch(console.error);
        }
      }
      
      // 4. Future Push Notifications
      // const pushEnabled = isChannelEnabled(user.pushPreferences, defaultPrefs, "push", category);
      // if (pushEnabled) { ... }

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
      const created = await db.notification.findMany({
        where: {
          userId: { in: userIds },
          title: payload.title,
          message: payload.message,
        },
        orderBy: { createdAt: "desc" },
        take: userIds.length,
      });

      // Fetch users for channel info
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { 
          id: true, 
          email: true, 
          emailPreferences: true, 
          phoneNumber: true, 
          whatsappPreferences: true,
          inAppPreferences: true,
          pushPreferences: true
        }
      });
      const userMap = new Map(users.map(u => [u.id, u]));

      // Fetch global defaults
      const defaultSetting = await db.systemSetting.findUnique({ where: { key: NOTIFICATION_DEFAULTS_KEY } });
      const defaultPrefs = (defaultSetting?.value as any) || {};
      const category = getCategoryForType(payload.type);

      // Queue Deliveries
      const emailDeliveriesData: any[] = [];
      const waDeliveriesData: any[] = [];
      const templateInfo = getEmailTemplateForType(payload.type, payload as CreateNotificationPayload);
      const waTemplateInfo = getWhatsAppTemplateForType(payload.type, payload as CreateNotificationPayload);

      for (const notification of created) {
        const user = userMap.get(notification.userId);
        if (user) {
          
          // 1. In-App Delivery
          const inAppEnabled = isChannelEnabled(user.inAppPreferences, defaultPrefs, "inApp", category);
          if (inAppEnabled) {
            notificationBroadcaster.broadcast(notification.userId, notification);
          }
          
          // 2. Email logic
          if (templateInfo) {
            const emailEnabled = isChannelEnabled(user.emailPreferences, defaultPrefs, "email", category);
            if (emailEnabled) {
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

          // 3. WhatsApp logic
          if (waTemplateInfo && user.phoneNumber) {
            const waEnabled = isChannelEnabled(user.whatsappPreferences, defaultPrefs, "whatsapp", category);
            if (waEnabled) {
              waDeliveriesData.push({
                notificationId: notification.id,
                toPhone: user.phoneNumber,
                messageType: waTemplateInfo.messageType,
                templateName: waTemplateInfo.templateName,
                content: waTemplateInfo.content,
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

      if (waDeliveriesData.length > 0) {
        await db.whatsAppDelivery.createMany({
          data: waDeliveriesData
        });
        
        // Fetch the newly created pending records to trigger processing
        db.whatsAppDelivery.findMany({
          where: { status: "PENDING" },
          take: waDeliveriesData.length,
          orderBy: { createdAt: "desc" }
        }).then(deliveries => {
          deliveries.forEach(d => WhatsAppService.processDelivery(d.id).catch(console.error));
        }).catch(console.error);
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
