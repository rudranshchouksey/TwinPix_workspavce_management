"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

export interface TaskInsight {
  id: string;
  type: "overdue" | "deadline" | "workload" | "velocity" | "review";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
}

export async function getTaskInsightsAction(): Promise<TaskInsight[]> {
  await requireAuth();

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    overdueTasks,
    dueTodayTasks,
    reviewTasks,
    highPriorityUnassigned,
    recentlyCompleted,
    upcomingDeadlineTasks,
  ] = await Promise.all([
    // Overdue tasks
    db.task.count({
      where: {
        status: { not: "DONE" },
        dueDate: { lt: startOfDay },
      },
    }),
    // Due today
    db.task.count({
      where: {
        status: { not: "DONE" },
        dueDate: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // Tasks stuck in review
    db.task.findMany({
      where: { status: "REVIEW" },
      select: { updatedAt: true },
      orderBy: { updatedAt: "asc" },
      take: 20,
    }),
    // High priority unassigned
    db.task.count({
      where: {
        priority: { in: ["HIGH", "URGENT"] },
        assigneeId: null,
        status: { not: "DONE" },
      },
    }),
    // Completed in last 7 days
    db.task.count({
      where: {
        status: "DONE",
        updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    // Tasks due within 3 days
    db.task.count({
      where: {
        status: { not: "DONE" },
        dueDate: {
          gte: startOfDay,
          lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const insights: TaskInsight[] = [];

  if (overdueTasks > 0) {
    insights.push({
      id: "overdue",
      type: "overdue",
      severity: overdueTasks >= 5 ? "high" : "medium",
      title: `${overdueTasks} Overdue Task${overdueTasks > 1 ? "s" : ""}`,
      description: `You have ${overdueTasks} task${overdueTasks > 1 ? "s" : ""} past their due date. Consider reprioritizing or updating deadlines.`,
    });
  }

  if (dueTodayTasks > 0) {
    insights.push({
      id: "due-today",
      type: "deadline",
      severity: dueTodayTasks >= 3 ? "medium" : "low",
      title: `${dueTodayTasks} Task${dueTodayTasks > 1 ? "s" : ""} Due Today`,
      description: `${dueTodayTasks} task${dueTodayTasks > 1 ? "s" : ""} need to be completed by end of day. Focus on high-priority items first.`,
    });
  }

  // Review queue aging
  const staleReviews = reviewTasks.filter(
    (t) => now.getTime() - new Date(t.updatedAt).getTime() > 2 * 24 * 60 * 60 * 1000
  );
  if (staleReviews.length > 0) {
    insights.push({
      id: "stale-reviews",
      type: "review",
      severity: staleReviews.length >= 3 ? "high" : "medium",
      title: `${staleReviews.length} Review${staleReviews.length > 1 ? "s" : ""} Waiting Too Long`,
      description: `${staleReviews.length} task${staleReviews.length > 1 ? "s have" : " has"} been in review for over 2 days. Expedite approvals to unblock progress.`,
    });
  }

  if (highPriorityUnassigned > 0) {
    insights.push({
      id: "unassigned-high",
      type: "workload",
      severity: "high",
      title: `${highPriorityUnassigned} High-Priority Unassigned`,
      description: `${highPriorityUnassigned} high or urgent task${highPriorityUnassigned > 1 ? "s are" : " is"} without an assignee. Assign them to keep momentum.`,
    });
  }

  if (recentlyCompleted > 0) {
    insights.push({
      id: "velocity",
      type: "velocity",
      severity: "low",
      title: `${recentlyCompleted} Completed This Week`,
      description: `Great progress! ${recentlyCompleted} task${recentlyCompleted > 1 ? "s were" : " was"} completed in the last 7 days.`,
    });
  }

  if (upcomingDeadlineTasks > dueTodayTasks) {
    const upcoming = upcomingDeadlineTasks - dueTodayTasks;
    insights.push({
      id: "upcoming-deadlines",
      type: "deadline",
      severity: upcoming >= 5 ? "medium" : "low",
      title: `${upcoming} Upcoming Deadline${upcoming > 1 ? "s" : ""}`,
      description: `${upcoming} task${upcoming > 1 ? "s are" : " is"} due within the next 3 days. Plan ahead to stay on track.`,
    });
  }

  return insights.slice(0, 4);
}
