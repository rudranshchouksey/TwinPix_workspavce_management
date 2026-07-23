import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  attachments: z.array(z.string()).default([]),
  labels: z.array(z.string()).default([]),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean()
  })).default([]),
  projectId: z.string().optional().nullable(),
  reporterId: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  actualHours: z.number().optional().nullable(),
  storyPoints: z.number().optional().nullable(),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const updateTaskSchema = taskSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
  parentId: z.string().optional().nullable(),
  attachments: z.array(z.string()).default([]),
});

export type TaskCommentInput = z.infer<typeof taskCommentSchema>;
