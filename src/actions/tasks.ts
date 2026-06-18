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
      entityId: task.id
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
  const validatedData = updateTaskSchema.parse(input);

  const existingTask = await db.task.findUnique({ where: { id } });
  if (!existingTask) throw new Error("Task not found");

  const updateData: any = { ...validatedData };
  if (validatedData.dueDate !== undefined) {
    updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
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
        entityId: task.id
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
  await requireAuth();
  
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
      entityId: taskId
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
