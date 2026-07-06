import { db } from "@/lib/db";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";

// Templates
import TaskAssignedEmail from "@/emails/templates/TaskAssignedEmail";
import CampaignAssignedEmail from "@/emails/templates/CampaignAssignedEmail";
import MeetingReminderEmail from "@/emails/templates/MeetingReminderEmail";
import DeadlineReminderEmail from "@/emails/templates/DeadlineReminderEmail";
import PaymentReminderEmail from "@/emails/templates/PaymentReminderEmail";
import AIDailySummaryEmail from "@/emails/templates/AIDailySummaryEmail";

const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");
const FROM_EMAIL = process.env.FROM_EMAIL || "TwinPix Studio <notifications@twinpix.studio>";

type TemplateMap = Record<string, React.FC<any>>;

const TEMPLATES: TemplateMap = {
  "TASK_ASSIGNED": TaskAssignedEmail,
  "CAMPAIGN_ASSIGNED": CampaignAssignedEmail,
  "MEETING_REMINDER": MeetingReminderEmail,
  "DEADLINE_REMINDER": DeadlineReminderEmail,
  "PAYMENT_REMINDER": PaymentReminderEmail,
  "AI_DAILY_SUMMARY": AIDailySummaryEmail,
};

export class EmailService {
  /**
   * Processes the email delivery queue.
   * Fetches up to 50 pending or failed emails (under 3 attempts).
   * Renders the HTML using React Email and sends via Resend.
   */
  static async processQueue() {
    console.log("[EmailService] Processing email queue...");
    const deliveries = await db.emailDelivery.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "FAILED", attempts: { lt: 3 } },
        ],
      },
      take: 50,
      orderBy: { createdAt: "asc" },
    });

    if (deliveries.length === 0) {
      return { processed: 0, successes: 0, failures: 0 };
    }

    let successes = 0;
    let failures = 0;

    for (const delivery of deliveries) {
      try {
        const TemplateComponent = TEMPLATES[delivery.templateName];
        if (!TemplateComponent) {
          throw new Error(`Template ${delivery.templateName} not found`);
        }

        // Render HTML from React component
        const payload = delivery.payload ? (delivery.payload as any) : {};
        // Use standard createElement for React 19 compatibility in this context
        const htmlContent = await render(React.createElement(TemplateComponent, payload));

        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [delivery.toEmail],
          subject: delivery.subject,
          html: htmlContent,
        });

        if (error) {
          throw new Error(error.message);
        }

        // Mark as sent
        await db.emailDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "SENT",
            attempts: { increment: 1 },
          },
        });
        successes++;
      } catch (err: any) {
        console.error(`[EmailService] Failed to send email ${delivery.id}:`, err);
        
        // Mark as failed
        await db.emailDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "FAILED",
            attempts: { increment: 1 },
            lastError: err?.message || String(err),
          },
        });
        failures++;
      }
    }

    console.log(`[EmailService] Processed ${deliveries.length} emails. Successes: ${successes}, Failures: ${failures}`);
    return { processed: deliveries.length, successes, failures };
  }
}
