import { db } from "@/lib/db";
import { NotificationService } from "./notification.service";
import { startOfDay, addDays, subDays } from "date-fns";
import { InstagramSyncService } from "./instagram/instagram-sync.service";

export class AutomationService {
  /**
   * Run all automation rules. Called securely via Cron endpoint.
   */
  static async runAll() {
    console.log("[AutomationService] Running all automations...");
    try {
      await this.processCampaignDeadlines();
      await this.processTaskEscalations();
      await this.processSyncFailures();
      await this.generateDailyDigests();
      console.log("[AutomationService] Completed automations.");
    } catch (error) {
      console.error("[AutomationService] Error running automations:", error);
    }
  }

  static async processCampaignDeadlines() {
    console.log("[AutomationService] Checking campaign deadlines...");
    const tomorrow = addDays(new Date(), 1);
    const startOfTomorrow = startOfDay(tomorrow);
    const endOfTomorrow = startOfDay(addDays(tomorrow, 1));

    const campaigns = await db.campaign.findMany({
      where: {
        endDate: {
          gte: startOfTomorrow,
          lt: endOfTomorrow
        },
        status: { in: ["ACTIVE", "PLANNING", "REVIEW"] }
      },
      include: {
        teamMembers: true
      }
    });

    for (const campaign of campaigns) {
      const log = await db.automationLog.findFirst({
        where: { ruleType: "CAMPAIGN_DEADLINE", entityId: campaign.id }
      });

      if (!log) {
        const userIds = campaign.teamMembers.map((tm: any) => tm.userId);
        
        if (userIds.length > 0) {
          await NotificationService.notifyUsers(userIds, {
            type: "CAMPAIGN_DEADLINE",
            title: `Campaign Deadline Tomorrow: ${campaign.name}`,
            message: `The campaign ${campaign.name} is ending tomorrow. Please review any pending deliverables.`,
            entityType: "CAMPAIGN",
            entityId: campaign.id,
            priority: "HIGH"
          });
        }

        await db.automationLog.create({
          data: {
            ruleType: "CAMPAIGN_DEADLINE",
            entityId: campaign.id,
            status: "SENT"
          }
        });
      }
    }
  }

  static async processTaskEscalations() {
    console.log("[AutomationService] Checking task escalations...");
    const now = new Date();
    
    const overdueTasks = await db.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: ["DONE", "REVIEW"] }
      },
      include: {
        assignee: true,
        author: true
      }
    });

    for (const task of overdueTasks) {
      if (!task.dueDate) continue;
      
      const hoursOverdue = (now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60);

      if (hoursOverdue > 48) {
        // Escalate to Manager (Task Author)
        const log = await db.automationLog.findFirst({
          where: { ruleType: "TASK_ESCALATION", entityId: task.id }
        });
        
        if (!log) {
          if (task.authorId) {
            await NotificationService.createNotification({
              userId: task.authorId,
              type: "TASK_ESCALATED",
              title: `Task Escalation: ${task.title}`,
              message: `Task assigned to ${task.assignee?.name || 'Unassigned'} is over 48 hours overdue.`,
              entityType: "TASK",
              entityId: task.id,
              priority: "CRITICAL"
            });
          }

          await db.automationLog.create({
            data: { ruleType: "TASK_ESCALATION", entityId: task.id }
          });
        }
      } else {
        // Just notify assignee
        const log = await db.automationLog.findFirst({
          where: { ruleType: "TASK_OVERDUE", entityId: task.id }
        });
        
        if (!log) {
          if (task.assigneeId) {
            await NotificationService.createNotification({
              userId: task.assigneeId,
              type: "TASK_OVERDUE",
              title: `Task Overdue: ${task.title}`,
              message: `Your task is overdue. Please update its status or request an extension.`,
              entityType: "TASK",
              entityId: task.id,
              priority: "HIGH"
            });
          }

          await db.automationLog.create({
            data: { ruleType: "TASK_OVERDUE", entityId: task.id }
          });
        }
      }
    }
  }

  static async processSyncFailures() {
    console.log("[AutomationService] Checking for sync failures...");
    const failedInfluencers = await db.influencer.findMany({
      where: { syncStatus: "FAILED" }
    });

    for (const influencer of failedInfluencers) {
      const log = await db.automationLog.findFirst({
        where: { ruleType: "SYNC_FAILURE_RETRY", entityId: influencer.id },
        orderBy: { createdAt: "desc" }
      });

      const yesterday = subDays(new Date(), 1);
      
      if (log && log.createdAt > yesterday) {
        // Escalate to Admins
        const escalatedLog = await db.automationLog.findFirst({
          where: { ruleType: "SYNC_FAILURE_ESCALATION", entityId: influencer.id }
        });
        
        if (!escalatedLog) {
          const admins = await db.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
          const adminIds = admins.map(a => a.id);
          
          if (adminIds.length > 0) {
            await NotificationService.notifyUsers(adminIds, {
              type: "SYSTEM_ALERT",
              title: `Sync Failed Repeatedly: @${influencer.instagramHandle}`,
              message: `The Instagram sync for @${influencer.instagramHandle} has failed multiple times. Manual intervention may be required.`,
              entityType: "INFLUENCER",
              entityId: influencer.id,
              priority: "HIGH"
            });
          }

          await db.automationLog.create({
            data: { ruleType: "SYNC_FAILURE_ESCALATION", entityId: influencer.id }
          });
        }
      } else {
        // Retry Automatically
        console.log(`[AutomationService] Retrying sync for @${influencer.instagramHandle}...`);
        try {
          // Fire and forget so we don't block the loop
          const instagramSync = new InstagramSyncService();
          instagramSync.syncInfluencer(influencer.id).catch(e => console.error("Retry failed", e));
          
          await db.automationLog.create({
            data: { ruleType: "SYNC_FAILURE_RETRY", entityId: influencer.id, status: "SENT" }
          });
        } catch (e) {
          console.error("Failed to start retry", e);
        }
      }
    }
  }

  static async generateDailyDigests() {
    console.log("[AutomationService] Generating daily digests...");
    const today = startOfDay(new Date());

    const users = await db.user.findMany({
      where: { status: "ACTIVE" }
    });

    for (const user of users) {
      const log = await db.automationLog.findFirst({
        where: { 
          ruleType: "DAILY_DIGEST", 
          entityId: user.id,
          createdAt: { gte: today }
        }
      });

      if (!log) {
        // Aggregate User Data
        const overdueTasksCount = await db.task.count({
          where: { assigneeId: user.id, status: { notIn: ["DONE", "REVIEW"] }, dueDate: { lt: new Date() } }
        });
        
        const activeCampaignsCount = await db.campaignTeamMember.count({
          where: { userId: user.id, campaign: { status: "ACTIVE" } }
        });
        
        const pendingApprovals = await db.campaignInfluencer.count({
          where: { status: "REVIEW_REQUIRED", campaign: { teamMembers: { some: { userId: user.id } } } }
        });

        // Skip if no relevant activity
        if (overdueTasksCount === 0 && activeCampaignsCount === 0 && pendingApprovals === 0) continue;

        let summary = `You have ${overdueTasksCount} overdue tasks and are managing ${activeCampaignsCount} active campaigns.`;
        if (pendingApprovals > 0) {
          summary += ` There are ${pendingApprovals} deliverables awaiting your approval.`;
        }

        await NotificationService.createNotification({
          userId: user.id,
          type: "AI_SUMMARY", // Maps to AI Category
          title: "Your Daily Digest",
          message: summary,
          priority: "LOW"
        });

        await db.automationLog.create({
          data: { ruleType: "DAILY_DIGEST", entityId: user.id }
        });
      }
    }
  }
}
