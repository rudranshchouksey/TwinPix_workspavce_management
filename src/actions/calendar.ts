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

  // Enforce colors based on type to ensure consistency
  let color = data.color || "#3b82f6";
  switch (data.type) {
    case "MEETING": color = "#8b5cf6"; break; // Purple
    case "TASK": color = "#3b82f6"; break; // Blue
    case "CAMPAIGN": color = "#10b981"; break; // Green
    case "CONTENT_POST": color = "#ec4899"; break; // Pink
    case "DEADLINE": color = "#ef4444"; break; // Red
  }

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
    let color = data.color || "#3b82f6";
    switch (data.type) {
      case "MEETING": color = "#8b5cf6"; break;
      case "TASK": color = "#3b82f6"; break;
      case "CAMPAIGN": color = "#10b981"; break;
      case "CONTENT_POST": color = "#ec4899"; break;
      case "DEADLINE": color = "#ef4444"; break;
    }
    data.color = color;
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

  const [dbEvents, tasks, campaigns] = await Promise.all([
    db.event.findMany({
      include: {
        campaign: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      }
    }),
    db.task.findMany({
      where: { dueDate: { not: null } },
      include: {
        assignee: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
      }
    }),
    db.campaign.findMany({
      where: { startDate: { not: null } },
      include: {
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
      type: e.type, // 'MEETING', 'CONTENT_POST', 'DEADLINE'
      color: e.color || "#8b5cf6",
      campaign: e.campaign,
      user: e.user,
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
        type: 'TASK',
        color: '#3b82f6', // Blue for tasks
        campaign: t.campaign,
        user: t.assignee,
        status: t.status,
        originalId: t.id
      });
    }
  });

  // 3. Campaigns
  campaigns.forEach(c => {
    if (c.startDate) {
      normalizedEvents.push({
        id: `campaign-${c.id}`,
        title: `Campaign: ${c.name}`,
        description: c.deliverables || c.notes,
        start: c.startDate,
        end: c.endDate || c.startDate,
        allDay: true,
        type: 'CAMPAIGN',
        color: '#10b981', // Green for campaigns
        status: c.status,
        originalId: c.id
      });
    }
  });

  // KPI Calculations
  let todaysEventsCount = 0;
  let upcomingDeadlinesCount = 0;
  let meetingsCount = 0;
  let campaignLaunchesCount = 0;
  let tasksDueTodayCount = 0;
  let contentScheduledCount = 0;
  let overdueItemsCount = 0;

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

    // Today's events
    if ((dStart <= endOfToday && dEnd >= startOfToday) || (dStart >= startOfToday && dStart <= endOfToday)) {
      todaysEventsCount++;
    }

    // Upcoming Deadlines (Tasks & Campaigns ending next 7 days)
    if ((e.type === 'TASK' || e.type === 'CAMPAIGN') && dEnd > endOfToday && dEnd <= next7Days) {
      upcomingDeadlinesCount++;
    }

    // Meetings (Future)
    if (e.type === 'MEETING' && dStart >= startOfToday) {
      meetingsCount++;
    }

    // Campaign Launches
    if (e.type === 'CAMPAIGN' && dStart >= weekStart && dStart <= weekEnd) {
      campaignLaunchesCount++;
    }

    // Tasks Due Today
    if (e.type === 'TASK' && dStart >= startOfToday && dStart <= endOfToday && e.status !== 'DONE') {
      tasksDueTodayCount++;
    }

    // Content Scheduled
    if (e.type === 'CONTENT_POST' && dStart >= startOfToday) {
      contentScheduledCount++;
    }

    // Overdue Items
    if ((e.type === 'TASK' && e.status !== 'DONE' && dStart < startOfToday) || 
        (e.type === 'CAMPAIGN' && e.status !== 'COMPLETED' && dEnd < startOfToday)) {
      overdueItemsCount++;
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
  
  if (tasksDueTodayCount > 0) {
    insights.push({
      type: "warning",
      title: "Tasks Due",
      description: `You have ${tasksDueTodayCount} tasks due today.`
    });
  }

  if (meetingsCount === 0) {
    insights.push({
      type: "success",
      title: "Clear Schedule",
      description: "No meetings scheduled today. Great time for deep work."
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
      description: `Campaign ${upcomingCampaigns[0].name} starts soon.`
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
      type: "info",
      title: "All Caught Up",
      description: "You have no pressing items or conflicts right now."
    });
  }

  return {
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
}
