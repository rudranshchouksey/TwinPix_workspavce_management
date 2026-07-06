"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export async function getWorkflowsAction() {
  await requireAdmin();
  return db.workflow.findMany({
    include: {
      steps: {
        orderBy: { order: "asc" }
      },
      _count: {
        select: { executions: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getWorkflowAction(id: string) {
  await requireAdmin();
  return db.workflow.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { order: "asc" }
      }
    }
  });
}

export async function createWorkflowAction(data: { name: string; description?: string; triggerType: string; triggerData?: any }) {
  await requireAdmin();
  
  const workflow = await db.workflow.create({
    data: {
      name: data.name,
      description: data.description,
      triggerType: data.triggerType,
      triggerData: data.triggerData || {}
    }
  });

  revalidatePath("/settings/automations");
  return workflow;
}

export async function toggleWorkflowAction(id: string, isActive: boolean) {
  await requireAdmin();
  
  await db.workflow.update({
    where: { id },
    data: { isActive }
  });
  
  revalidatePath("/settings/automations");
}

export async function deleteWorkflowAction(id: string) {
  await requireAdmin();
  
  await db.workflow.delete({
    where: { id }
  });
  
  revalidatePath("/settings/automations");
}

export async function updateWorkflowStepsAction(workflowId: string, steps: any[]) {
  await requireAdmin();
  
  // Clean existing steps
  await db.workflowStep.deleteMany({
    where: { workflowId }
  });

  // Re-insert ordered steps
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    await db.workflowStep.create({
      data: {
        workflowId,
        type: step.type,
        actionType: step.actionType,
        config: step.config || {},
        order: i
      }
    });
  }

  revalidatePath(`/settings/automations/${workflowId}`);
  return { success: true };
}
