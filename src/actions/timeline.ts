"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type ActivityCategory = 'TASK' | 'CAMPAIGN' | 'INFLUENCER' | 'FILE' | 'MEETING' | 'APPROVAL' | 'COMMENT' | 'SYSTEM';

export interface UnifiedActivity {
  id: string;
  category: ActivityCategory;
  action: string;
  entityName: string;
  details?: string;
  timestamp: Date;
  user: {
    id?: string;
    name: string;
    image: string | null;
  };
}

export async function getUnifiedProjectTimelineAction(projectId: string): Promise<{ success: boolean; data?: UnifiedActivity[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Fetch all related entities in parallel
    const [
      tasks,
      campaigns,
      events,
      files,
      projectLogs
    ] = await Promise.all([
      db.task.findMany({
        where: { projectId },
        include: {
          author: true,
          assignee: true,
          activities: { include: { user: true } },
          comments: { include: { user: true } }
        }
      }),
      db.campaign.findMany({
        where: { projectId },
        include: {
          client: true,
          activities: true,
          influencers: { include: { influencer: true } }
        }
      }),
      db.event.findMany({
        where: { projectId },
        include: { user: true }
      }),
      db.file.findMany({
        where: { projectId },
        include: { uploadedBy: true, activities: { include: { user: true } } }
      }),
      db.activityLog.findMany({
        where: { entityType: "PROJECT", entityId: projectId },
        include: { user: true }
      })
    ]);

    const timeline: UnifiedActivity[] = [];

    // Helper to format user
    const formatUser = (userObj: any, fallbackName = "System") => ({
      id: userObj?.id,
      name: userObj?.name || fallbackName,
      image: userObj?.image || null
    });

    // 1. Tasks
    tasks.forEach(task => {
      // Task Created
      timeline.push({
        id: `task-created-${task.id}`,
        category: 'TASK',
        action: 'created task',
        entityName: task.title,
        details: task.description || undefined,
        timestamp: task.createdAt,
        user: formatUser(task.author)
      });

      // Task Activities (Status changes, etc.)
      task.activities.forEach(activity => {
        timeline.push({
          id: `task-activity-${activity.id}`,
          category: activity.type.includes('APPROVAL') ? 'APPROVAL' : 'TASK',
          action: activity.type.toLowerCase().replace(/_/g, ' '),
          entityName: task.title,
          details: activity.details,
          timestamp: activity.createdAt,
          user: formatUser(activity.user)
        });
      });

      // Task Comments
      task.comments.forEach(comment => {
        timeline.push({
          id: `task-comment-${comment.id}`,
          category: 'COMMENT',
          action: 'added a comment on',
          entityName: task.title,
          details: comment.content,
          timestamp: comment.createdAt,
          user: formatUser(comment.user)
        });
      });
    });

    // 2. Campaigns
    campaigns.forEach(campaign => {
      // Campaign Created
      timeline.push({
        id: `campaign-created-${campaign.id}`,
        category: 'CAMPAIGN',
        action: 'created campaign',
        entityName: campaign.name,
        timestamp: campaign.createdAt,
        user: formatUser(null) // We don't have campaign author easily available in schema, default to System
      });

      // Campaign Activities (Status changes, budget updates)
      campaign.activities.forEach((activity: any) => {
        timeline.push({
          id: `campaign-activity-${activity.id}`,
          category: activity.type.includes('BUDGET') ? 'CAMPAIGN' : 'CAMPAIGN',
          action: activity.type.toLowerCase().replace(/_/g, ' '),
          entityName: campaign.name,
          details: activity.details,
          timestamp: activity.createdAt,
          user: formatUser(null) // CampaignActivity doesn't strictly have user in all cases depending on schema
        });
      });

      // Campaign Influencers Added
      campaign.influencers.forEach((ci: any) => {
        timeline.push({
          id: `campaign-influencer-${ci.id}`,
          category: 'INFLUENCER',
          action: 'added influencer',
          entityName: ci.influencer.influencerName || ci.influencer.instagramHandle,
          details: `To campaign: ${campaign.name}`,
          timestamp: ci.createdAt,
          user: formatUser(null)
        });
      });
    });

    // 3. Events (Meetings Scheduled)
    events.forEach(event => {
      timeline.push({
        id: `event-${event.id}`,
        category: 'MEETING',
        action: 'scheduled meeting',
        entityName: event.title,
        details: event.description || undefined,
        timestamp: event.createdAt,
        user: formatUser(event.user)
      });
    });

    // 4. Files
    files.forEach(file => {
      timeline.push({
        id: `file-${file.id}`,
        category: 'FILE',
        action: 'uploaded file',
        entityName: file.fileName,
        details: file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : undefined,
        timestamp: file.createdAt,
        user: formatUser(file.uploadedBy)
      });
      
      file.activities?.forEach(activity => {
        timeline.push({
          id: `file-activity-${activity.id}`,
          category: 'FILE',
          action: activity.type.toLowerCase().replace(/_/g, ' '),
          entityName: file.fileName,
          details: activity.details,
          timestamp: activity.createdAt,
          user: formatUser(activity.user)
        });
      });
    });

    // 5. ActivityLogs (Generic Project Logs)
    projectLogs.forEach(log => {
      timeline.push({
        id: `log-${log.id}`,
        category: 'SYSTEM',
        action: log.action,
        entityName: log.targetName || 'Project',
        details: log.details || undefined,
        timestamp: log.createdAt,
        user: formatUser(log.user, log.userName || "System")
      });
    });

    // Sort by timestamp descending
    timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return { success: true, data: timeline };
  } catch (error: any) {
    console.error("Failed to fetch unified timeline", error);
    return { success: false, error: error.message };
  }
}
