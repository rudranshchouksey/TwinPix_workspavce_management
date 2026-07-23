"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  TaskInput,
  taskSchema,
  UpdateTaskInput,
  updateTaskSchema,
  TaskCommentInput,
  taskCommentSchema
} from "@/lib/validations/task";
import { logActivity } from "@/actions/activity";
import { createNotification } from "@/actions/notifications";

async function logTaskActivity(taskId: string, type: string, details: string) {
  const user = await requireAuth();
  await db.taskActivity.create({
    data: {
      taskId,
      type,
      details,
      userId: user.id,
    },
  });
}

export async function getTasksAction(params: {
  status?: string;
  priority?: string;
  assigneeId?: string;
  campaignId?: string;
}) {
  await requireAuth();

  const where: any = {};
  if (params.status) where.status = params.status;
  if (params.priority) where.priority = params.priority;
  if (params.assigneeId) where.assigneeId = params.assigneeId;
  if (params.campaignId) where.campaignId = params.campaignId;

  const tasks = await db.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      campaign: { select: { id: true, name: true } },
      comments: { select: { id: true } }, // just for count
    },
    orderBy: { createdAt: "desc" },
  });

  return tasks;
}

// Lightweight name-only lookup for page titles/breadcrumbs (avoids the heavy includes below)
export async function getTaskNameAction(id: string) {
  await requireAuth();
  return db.task.findUnique({
    where: { id },
    select: { title: true },
  });
}

export async function getTaskByIdAction(id: string) {
  await requireAuth();

  const task = await db.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, image: true, email: true } },
      author: { select: { id: true, name: true, image: true } },
      campaign: { select: { id: true, name: true } },
      comments: {
        include: {
          user: { select: { id: true, name: true, image: true } }
        },
        orderBy: { createdAt: "asc" }
      },
      activities: {
        include: {
          task: { select: { id: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      }
    },
  });

  return task;
}

export async function createTaskAction(input: TaskInput) {
  const user = await requireAuth();
  if (user.role === "CLIENT") throw new Error("Unauthorized to create tasks");

  const validatedData = taskSchema.parse(input);

  const task = await db.task.create({
    data: {
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority as any,
      status: validatedData.status as any,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      assigneeId: validatedData.assigneeId,
      campaignId: validatedData.campaignId,
      attachments: validatedData.attachments,
      labels: validatedData.labels,
      checklist: validatedData.checklist ? (validatedData.checklist as any) : undefined,
      authorId: user.id,
    },
  });

  await logTaskActivity(task.id, "TASK_CREATED", `Task created by ${user.name}`);

  await logActivity({
    userId: user.id,
    userName: user.name ?? undefined,
    action: "created task",
    entityType: "TASK",
    entityId: task.id,
    targetName: task.title
  });

  if (task.assigneeId && task.assigneeId !== user.id) {
    await createNotification({
      userId: task.assigneeId,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: `${user.name} assigned you: ${task.title}`,
      link: `/tasks`,
      entityId: task.id,
      entityType: "TASK",
      priority: "HIGH"
    });
  }

  revalidatePath("/tasks");
  if (validatedData.campaignId) {
    revalidatePath(`/campaigns/${validatedData.campaignId}`);
  }
  
  return task;
}

export async function updateTaskAction(id: string, input: UpdateTaskInput) {
  const user = await requireAuth();
  if (user.role === "CLIENT") throw new Error("Unauthorized to edit tasks");

  const validatedData = updateTaskSchema.parse(input);

  const existingTask = await db.task.findUnique({ where: { id } });
  if (!existingTask) throw new Error("Task not found");

  const updateData: any = { ...validatedData };
  if (validatedData.dueDate !== undefined) {
    updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
  }

  if (validatedData.checklist !== undefined) {
    updateData.checklist = validatedData.checklist ? (validatedData.checklist as any) : undefined;
  }

  const task = await db.task.update({
    where: { id },
    data: updateData,
  });

  if (existingTask.status !== task.status) {
    await logTaskActivity(task.id, "STATUS_CHANGED", `Moved to ${task.status}`);
  } else if (existingTask.assigneeId !== task.assigneeId) {
    await logTaskActivity(task.id, "ASSIGNEE_CHANGED", `Assignee updated`);
    if (task.assigneeId && task.assigneeId !== user.id) {
      await createNotification({
        userId: task.assigneeId,
        type: "TASK_ASSIGNED",
        title: "Task Assigned",
        message: `${user.name} assigned you to: ${task.title}`,
        link: `/tasks`,
        entityId: task.id,
        entityType: "TASK",
        priority: "HIGH"
      });
    }
  } else {
    await logTaskActivity(task.id, "TASK_UPDATED", `Task updated by ${user.name}`);
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  if (task.campaignId) {
    revalidatePath(`/campaigns/${task.campaignId}`);
  }

  return task;
}

export async function deleteTaskAction(id: string) {
  const user = await requireAuth();
  
  if (user.role === "CLIENT") throw new Error("Unauthorized to delete tasks");
  
  const task = await db.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");

  await db.task.delete({ where: { id } });

  revalidatePath("/tasks");
  if (task.campaignId) {
    revalidatePath(`/campaigns/${task.campaignId}`);
  }
}

export async function addTaskCommentAction(taskId: string, input: TaskCommentInput) {
  const user = await requireAuth();
  if (user.role === "CLIENT") throw new Error("Unauthorized to comment");

  const validatedData = taskCommentSchema.parse(input);

  const comment = await db.taskComment.create({
    data: {
      taskId,
      userId: user.id,
      content: validatedData.content,
    },
    include: {
      user: { select: { id: true, name: true, image: true } }
    }
  });

  await logTaskActivity(taskId, "COMMENT_ADDED", `Comment added by ${user.name}`);

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (task?.assigneeId && task.assigneeId !== user.id) {
    await createNotification({
      userId: task.assigneeId,
      type: "COMMENT_ADDED",
      title: "New Comment on Task",
      message: `${user.name} commented: "${validatedData.content.substring(0, 30)}..."`,
      link: `/tasks`,
      entityId: taskId,
      entityType: "TASK",
      priority: "MEDIUM"
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  return comment;
}

export async function deleteTaskCommentAction(commentId: string) {
  const user = await requireAuth();
  
  const comment = await db.taskComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");

  // Only author or admin can delete
  if (comment.userId !== user.id && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    throw new Error("Unauthorized to delete this comment");
  }

  await db.taskComment.delete({ where: { id: commentId } });

  revalidatePath(`/tasks/${comment.taskId}`);
}

// ─── Task KPIs ───────────────────────────────────────────────────

export interface TaskKpis {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  completed: number;
  overdue: number;
  highPriority: number;
  dueToday: number;
  growth: Record<string, number | null>;
  series: Record<string, number[]>;
}

export async function getTaskKpisAction(): Promise<TaskKpis> {
  await requireAuth();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    total,
    todo,
    inProgress,
    review,
    completed,
    overdue,
    highPriority,
    dueToday,
    totalPrev,
    completedPrev,
    completedRecent,
  ] = await Promise.all([
    db.task.count(),
    db.task.count({ where: { status: "TODO" } }),
    db.task.count({ where: { status: "IN_PROGRESS" } }),
    db.task.count({ where: { status: "REVIEW" } }),
    db.task.count({ where: { status: "DONE" } }),
    db.task.count({
      where: { status: { not: "DONE" }, dueDate: { lt: startOfDay } },
    }),
    db.task.count({
      where: { priority: { in: ["HIGH", "URGENT"] }, status: { not: "DONE" } },
    }),
    db.task.count({
      where: { status: { not: "DONE" }, dueDate: { gte: startOfDay, lte: endOfDay } },
    }),
    // Previous period counts for growth
    db.task.count({ where: { createdAt: { lt: sevenDaysAgo } } }),
    db.task.count({ where: { status: "DONE", updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    db.task.count({ where: { status: "DONE", updatedAt: { gte: sevenDaysAgo } } }),
  ]);

  // Growth calculations
  const totalGrowth = totalPrev > 0 ? Math.round(((total - totalPrev) / totalPrev) * 100) : null;
  const completedGrowth = completedPrev > 0 ? Math.round(((completedRecent - completedPrev) / completedPrev) * 100) : null;

  // Build sparkline series (last 8 weeks of task creation)
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  const weeklyTasks = await db.task.findMany({
    where: { createdAt: { gte: eightWeeksAgo } },
    select: { createdAt: true, status: true },
  });

  const weekBuckets: number[] = Array(8).fill(0);
  const completedBuckets: number[] = Array(8).fill(0);
  for (const t of weeklyTasks) {
    const weeksAgo = Math.floor((now.getTime() - new Date(t.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const idx = 7 - Math.min(weeksAgo, 7);
    weekBuckets[idx]++;
    if (t.status === "DONE") completedBuckets[idx]++;
  }

  return {
    total,
    todo,
    inProgress,
    review,
    completed,
    overdue,
    highPriority,
    dueToday,
    growth: {
      total: totalGrowth,
      completed: completedGrowth,
      todo: null,
      inProgress: null,
      review: null,
      overdue: null,
      highPriority: null,
      dueToday: null,
    },
    series: {
      total: weekBuckets,
      completed: completedBuckets,
      todo: weekBuckets.map(() => todo),
      inProgress: weekBuckets.map(() => inProgress),
      review: weekBuckets.map(() => review),
      overdue: weekBuckets.map(() => overdue),
      highPriority: weekBuckets.map(() => highPriority),
      dueToday: weekBuckets.map(() => dueToday),
    },
  };
}
