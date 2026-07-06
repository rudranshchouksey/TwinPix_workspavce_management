import { db } from "@/lib/db";
import { CreateNotificationPayload } from "./notification.service";

interface SendMessageOptions {
  toPhone: string;
  type: "text" | "template";
  content?: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  deliveryRecordId?: string;
}

export class WhatsAppService {
  private static readonly API_URL = "https://graph.facebook.com/v19.0";
  private static readonly MAX_RETRIES = 3;

  /**
   * Main entry point to process a WhatsApp delivery from the database.
   */
  static async processDelivery(deliveryId: string) {
    try {
      const delivery = await db.whatsAppDelivery.findUnique({
        where: { id: deliveryId },
      });

      if (!delivery || delivery.status !== "PENDING") {
        return;
      }

      const { toPhone, messageType, content, templateName } = delivery;
      const payload = content as any;

      if (messageType === "TEMPLATE" && templateName) {
        await this.sendMessageWithRetry({
          toPhone,
          type: "template",
          templateName,
          templateLanguage: payload?.language || "en_US",
          templateComponents: payload?.components || [],
          deliveryRecordId: delivery.id,
        });
      } else if (messageType === "TEXT" && payload?.text) {
        await this.sendMessageWithRetry({
          toPhone,
          type: "text",
          content: payload.text,
          deliveryRecordId: delivery.id,
        });
      }
    } catch (error: any) {
      console.error(`[WhatsAppService] Delivery failed for ${deliveryId}:`, error);
      // Status update is handled inside sendMessageWithRetry
    }
  }

  /**
   * Internal method with retry logic and exponential backoff
   */
  private static async sendMessageWithRetry(options: SendMessageOptions, attempt = 1): Promise<void> {
    try {
      const response = await this.sendGraphApiRequest(options);

      if (options.deliveryRecordId) {
        await db.whatsAppDelivery.update({
          where: { id: options.deliveryRecordId },
          data: {
            status: "SENT",
            messageId: response?.messages?.[0]?.id,
            attempts: { increment: 1 },
          },
        });
      }
    } catch (error: any) {
      console.error(`[WhatsAppService] Attempt ${attempt} failed:`, error.message);

      if (attempt < this.MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.sendMessageWithRetry(options, attempt + 1);
      } else {
        if (options.deliveryRecordId) {
          await db.whatsAppDelivery.update({
            where: { id: options.deliveryRecordId },
            data: {
              status: "FAILED",
              attempts: { increment: 1 },
              lastError: error.message || String(error),
            },
          });
        }
        throw error;
      }
    }
  }

  /**
   * Makes the actual fetch call to WhatsApp Cloud API
   */
  private static async sendGraphApiRequest(options: SendMessageOptions) {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      throw new Error("Missing WhatsApp API configuration in environment variables.");
    }

    const url = `${this.API_URL}/${phoneNumberId}/messages`;
    
    // Ensure clean numeric string
    const formattedPhone = options.toPhone.replace(/\D/g, '');
    
    const body: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
    };

    if (options.type === "text") {
      body.type = "text";
      body.text = { preview_url: false, body: options.content };
    } else if (options.type === "template") {
      body.type = "template";
      body.template = {
        name: options.templateName,
        language: { code: options.templateLanguage || "en_US" },
        components: options.templateComponents || [],
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || `WhatsApp API error: ${response.statusText}`);
    }

    return data;
  }
}

/**
 * Helper to map system Event Types to WhatsApp templates or text formatting.
 */
export function getWhatsAppTemplateForType(type: string, payload: CreateNotificationPayload): {
  messageType: "TEXT" | "TEMPLATE";
  templateName?: string;
  content: any;
} | null {
  const buildTextMessage = (text: string) => ({
    messageType: "TEXT" as const,
    content: { text },
  });

  switch (type) {
    case "CAMPAIGN_DEADLINE":
      return buildTextMessage(`🚨 *Deadline Alert*\n\n${payload.title}\n${payload.message}`);
      
    case "MEETING_REMINDER":
    case "CLIENT_MEETING":
    case "TEAM_MEETING":
      return buildTextMessage(`📅 *Meeting Reminder*\n\n${payload.title}\n${payload.message}`);

    case "TASK_ASSIGNED":
    case "TASK":
      return buildTextMessage(`📋 *New Task*\n\n${payload.title}\n${payload.message}`);

    case "PAYMENT_REMINDER":
    case "INVOICE_DUE":
      return buildTextMessage(`💰 *Payment Alert*\n\n${payload.title}\n${payload.message}`);

    case "SYSTEM_ALERT":
    case "ADMIN_ALERT":
      return buildTextMessage(`⚙️ *System Alert*\n\n${payload.title}\n${payload.message}`);

    default:
      return null;
  }
}
