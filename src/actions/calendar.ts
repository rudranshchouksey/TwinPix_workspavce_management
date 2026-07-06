"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function getEventsAction(filters?: { type?: string; campaignId?: string }) {
  await requireAuth();

  const where: any = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.campaignId) where.campaignId = filters.campaignId;

  return db.event.findMany({
    where,
    include: {
      campaign: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { start: "asc" },
  });
}

function getEventColor(type: string, customColor?: string) {
  if (customColor) return customColor;
  
  // Campaign - Purple
  if (["CAMPAIGN", "CAMPAIGN_LAUNCH", "CAMPAIGN_DEADLINE", "CAMPAIGN_REVIEW"].includes(type)) return "#8b5cf6"; // Purple
  
  // Content - Green
  if (["CONTENT_POST", "INSTAGRAM_POST", "INSTAGRAM_REEL", "INSTAGRAM_STORY", "YOUTUBE_UPLOAD", "BRAND_COLLABORATION"].includes(type)) return "#10b981"; // Green
  
  // Meetings - Blue
  if (["MEETING", "CLIENT_MEETING", "DISCOVERY_CALL", "TEAM_MEETING", "INTERNAL_STANDUP"].includes(type)) return "#3b82f6"; // Blue
  
  // Deliverables - Red
  if (["TASK", "DEADLINE", "DELIVERABLE_DUE"].includes(type)) return "#ef4444"; // Red
  
  // Approvals/Reminders - Orange
  if (["FOLLOW_UP_REMINDER", "CONTRACT_REMINDER", "PAYMENT_REMINDER", "APPROVAL_DEADLINE", "CONTENT_APPROVAL"].includes(type)) return "#f97316"; // Orange
  
  // Shoots - Pink
  if (["INFLUENCER_PHOTOSHOOT", "VIDEO_SHOOT", "LIVE_EVENT", "PODCAST_RECORDING"].includes(type)) return "#ec4899"; // Pink
  
  // Payments - Yellow
  if (["INVOICE_DUE"].includes(type)) return "#eab308"; // Yellow
  
  // Contracts - Slate
  if (["CONTRACT_SIGNING"].includes(type)) return "#64748b"; // Slate

  return "#3b82f6"; // Default Blue
}

export async function createEventAction(data: {
  title: string;
  description?: string;
  type: any;
  start: Date;
  end?: Date;
  allDay?: boolean;
  color?: string;
  campaignId?: string;
  taskId?: string;
  influencerId?: string;
}) {
  const user = await requireAuth();
  
  const color = getEventColor(data.type, data.color);

  const event = await db.event.create({
    data: {
      ...data,
      color,
      userId: user.id,
    },
  });

  revalidatePath("/calendar");
  return event;
}

export async function updateEventAction(id: string, data: any) {
  await requireAuth();

  if (data.type) {
    data.color = getEventColor(data.type, data.color);
  }

  const event = await db.event.update({
    where: { id },
    data,
  });

  revalidatePath("/calendar");
  return event;
}

export async function deleteEventAction(id: string) {
  await requireAuth();

  await db.event.delete({
    where: { id },
  });

  revalidatePath("/calendar");
}

export async function getCalendarDashboardDataAction() {
  await requireAuth();
  
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const next7Days = new Date(endOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch from ALL unified sources
  const [dbEvents, tasks, campaigns, projects, contentSchedules, invoices] = await Promise.all([
    db.event.findMany({
      include: {
        campaign: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        influencer: { select: { id: true, influencerName: true, instagramHandle: true, profileImage: true } }
      }
    }),
    db.task.findMany({
      where: { dueDate: { not: null } },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        campaign: { select: { id: true, name: true } },
      }
    }),
    db.campaign.findMany({
      include: {
        client: { select: { id: true, companyName: true } }
      }
    }),
    db.project.findMany({
      where: { milestoneDate: { not: null } },
      include: {
        client: { select: { id: true, companyName: true } }
      }
    }),
    db.contentSchedule.findMany({
      include: {
        campaign: { select: { id: true, name: true } },
        influencer: { select: { id: true, influencerName: true, instagramHandle: true, profileImage: true } }
      }
    }),
    db.invoice.findMany({
      include: {
        campaign: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true } }
      }
    })
  ]);

  // Normalize all entities into FullCalendar Event format
  const normalizedEvents: any[] = [];
  
  // 1. Regular Events
  dbEvents.forEach(e => {
    normalizedEvents.push({
      id: e.id,
      title: e.title,
      description: e.description,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      type: e.type, 
      color: getEventColor(e.type, e.color || undefined),
      campaign: e.campaign,
      user: e.user,
      influencer: e.influencer,
      isRealEvent: true
    });
  });

  // 2. Tasks
  tasks.forEach(t => {
    if (t.dueDate) {
      normalizedEvents.push({
        id: `task-${t.id}`,
        title: `Task: ${t.title}`,
        description: t.description,
        start: t.dueDate,
        end: t.dueDate,
        allDay: true,
        type: 'DELIVERABLE_DUE',
        color: getEventColor('DELIVERABLE_DUE'),
        campaign: t.campaign,
        user: t.assignee,
        status: t.status,
        originalId: t.id
      });
    }
  });

  // 3. Campaigns (Launch and Deadline)
  campaigns.forEach(c => {
    if (c.startDate) {
      normalizedEvents.push({
        id: `campaign-launch-${c.id}`,
        title: `Launch: ${c.name}`,
        description: c.deliverables || c.notes,
        start: c.startDate,
        end: c.startDate,
        allDay: true,
        type: 'CAMPAIGN_LAUNCH',
        color: getEventColor('CAMPAIGN_LAUNCH'),
        client: c.client,
        status: c.status,
        originalId: c.id
      });
    }
    if (c.endDate) {
      normalizedEvents.push({
        id: `campaign-deadline-${c.id}`,
        title: `Deadline: ${c.name}`,
        description: c.deliverables || c.notes,
        start: c.endDate,
        end: c.endDate,
        allDay: true,
        type: 'CAMPAIGN_DEADLINE',
        color: getEventColor('CAMPAIGN_DEADLINE'),
        client: c.client,
        status: c.status,
        originalId: c.id
      });
    }
  });

  // 4. Projects (Milestones)
  projects.forEach(p => {
    if (p.milestoneDate) {
      normalizedEvents.push({
        id: `project-${p.id}`,
        title: `Milestone: ${p.name}`,
        description: p.description,
        start: p.milestoneDate,
        end: p.milestoneDate,
        allDay: true,
        type: 'CAMPAIGN_REVIEW', // Using campaign review color logic
        color: getEventColor('CAMPAIGN_REVIEW'),
        client: p.client,
        status: p.status,
        originalId: p.id
      });
    }
  });

  // 5. Scheduled Content
  contentSchedules.forEach(cs => {
    normalizedEvents.push({
      id: `content-${cs.id}`,
      title: `${cs.platform.replace("_", " ")}: ${cs.influencer.instagramHandle}`,
      description: cs.caption,
      start: cs.publishDate,
      end: cs.publishDate,
      allDay: true, // or specific time if available
      type: cs.platform, 
      color: getEventColor(cs.platform),
      campaign: cs.campaign,
      influencer: cs.influencer,
      status: cs.status,
      originalId: cs.id,
      mediaUrl: cs.mediaUrl
    });
  });

  // 6. Invoices
  invoices.forEach(i => {
    normalizedEvents.push({
      id: `invoice-${i.id}`,
      title: `Invoice Due: ${i.client?.companyName || 'Client'}`,
      description: `Amount: $${i.amount}`,
      start: i.dueDate,
      end: i.dueDate,
      allDay: true,
      type: 'INVOICE_DUE',
      color: getEventColor('INVOICE_DUE'),
      campaign: i.campaign,
      client: i.client,
      status: i.status,
      originalId: i.id
    });
  });

  // KPI Calculations & Intelligence Generation
  let todaysEventsCount = 0;
  let upcomingDeadlinesCount = 0;
  let meetingsCount = 0;
  let campaignLaunchesCount = 0;
  let tasksDueTodayCount = 0;
  let contentScheduledCount = 0;
  let overdueItemsCount = 0;
  
  // Conflict tracking variables
  const influencerDays: Record<string, string[]> = {};
  const campaignContentCount: Record<string, number> = {};

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0,0,0,0);
    return d;
  };
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  weekEnd.setHours(23,59,59,999);

  normalizedEvents.forEach(e => {
    const dStart = new Date(e.start);
    const dEnd = e.end ? new Date(e.end) : dStart;

    // Stats
    if ((dStart <= endOfToday && dEnd >= startOfToday) || (dStart >= startOfToday && dStart <= endOfToday)) {
      todaysEventsCount++;
    }

    if ((['DELIVERABLE_DUE', 'CAMPAIGN_DEADLINE'].includes(e.type)) && dEnd > endOfToday && dEnd <= next7Days) {
      upcomingDeadlinesCount++;
    }

    if (['MEETING', 'CLIENT_MEETING', 'DISCOVERY_CALL', 'TEAM_MEETING'].includes(e.type) && dStart >= startOfToday) {
      meetingsCount++;
    }

    if (e.type === 'CAMPAIGN_LAUNCH' && dStart >= weekStart && dStart <= weekEnd) {
      campaignLaunchesCount++;
    }

    if (e.type === 'DELIVERABLE_DUE' && dStart >= startOfToday && dStart <= endOfToday && e.status !== 'DONE') {
      tasksDueTodayCount++;
    }

    if (['CONTENT_POST', 'INSTAGRAM_POST', 'INSTAGRAM_REEL', 'INSTAGRAM_STORY', 'YOUTUBE_UPLOAD'].includes(e.type) && dStart >= startOfToday) {
      contentScheduledCount++;
      
      if (e.campaign?.id) {
        campaignContentCount[e.campaign.id] = (campaignContentCount[e.campaign.id] || 0) + 1;
      }
    }

    if ((e.type === 'DELIVERABLE_DUE' && e.status !== 'DONE' && dStart < startOfToday) || 
        (e.type === 'CAMPAIGN_DEADLINE' && e.status !== 'COMPLETED' && dEnd < startOfToday)) {
      overdueItemsCount++;
    }
    
    // Conflict Detection Logic (Influencer overlapping)
    if (['INFLUENCER_PHOTOSHOOT', 'VIDEO_SHOOT', 'LIVE_EVENT'].includes(e.type) && e.influencer?.id) {
      const dateKey = dStart.toISOString().split('T')[0];
      const key = `${e.influencer.id}-${dateKey}`;
      if (!influencerDays[key]) influencerDays[key] = [];
      influencerDays[key].push(e.id);
    }
  });

  // Pending Approvals
  const pendingTasks = tasks.filter(t => t.status === 'REVIEW').map(t => ({
    id: t.id,
    title: t.title,
    type: 'Task',
    requester: t.assignee?.name || 'System'
  }));

  const pendingCampaigns = campaigns.filter(c => c.status === 'REVIEW').map(c => ({
    id: c.id,
    title: c.name,
    type: 'Campaign',
    requester: c.client?.companyName || 'Client'
  }));

  const pendingApprovals = [...pendingTasks, ...pendingCampaigns];

  // AI Insights Generation
  const insights: any[] = [];
  
  if (contentScheduledCount > 0 && contentScheduledCount < 3) {
      insights.push({
          type: "warning",
          title: "Low Content Volume",
          description: "Content posting frequency is lower this week. Consider scheduling more posts."
      });
  }

  // Detect overlapping shoots
  let overlappingShoots = 0;
  for (const key in influencerDays) {
      if (influencerDays[key].length > 1) overlappingShoots++;
  }
  if (overlappingShoots > 0) {
      insights.push({
          type: "danger",
          title: "Scheduling Conflict",
          description: `Influencer booked multiple times on the same day (${overlappingShoots} conflicts).`
      });
  }
  
  const upcomingCampaignsWithoutContent = campaigns.filter(c => {
      if (c.status === 'ACTIVE' || c.status === 'PLANNING') {
          return !campaignContentCount[c.id] || campaignContentCount[c.id] === 0;
      }
      return false;
  });
  
  if (upcomingCampaignsWithoutContent.length > 0) {
      insights.push({
          type: "warning",
          title: "Missing Content",
          description: `Campaign ${upcomingCampaignsWithoutContent[0].name} has no scheduled content.`
      });
  }

  if (tasksDueTodayCount > 0) {
    insights.push({
      type: "warning",
      title: "Tasks Due",
      description: `You have ${tasksDueTodayCount} tasks due today.`
    });
  }

  const upcomingCampaigns = campaigns.filter(c => {
    if (!c.startDate) return false;
    const d = new Date(c.startDate);
    return d > endOfToday && d <= next7Days;
  });

  if (upcomingCampaigns.length > 0) {
    insights.push({
      type: "info",
      title: "Campaign Launch",
      description: `Campaign ${upcomingCampaigns[0].name} starts in a few days.`
    });
  }

  if (overdueItemsCount > 0) {
    insights.push({
      type: "danger",
      title: "Overdue Items",
      description: `You have ${overdueItemsCount} overdue items that need attention.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "success",
      title: "All Caught Up",
      description: "You have no pressing items or conflicts right now. Everything is running smoothly."
    });
  }

  const payload = {
    events: normalizedEvents,
    kpis: {
      todaysEvents: todaysEventsCount,
      upcomingDeadlines: upcomingDeadlinesCount,
      meetings: meetingsCount,
      campaignLaunches: campaignLaunchesCount,
      tasksDue: tasksDueTodayCount,
      contentScheduled: contentScheduledCount,
      overdueItems: overdueItemsCount
    },
    insights,
    pendingApprovals
  };

  // Stringify and parse to remove all undefined values which crash Next.js Server Components
  return JSON.parse(JSON.stringify(payload));
}
