import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { WorkflowEngine } from "@/services/workflow.engine";

// Example Usage: GET /api/cron/automations (Should be hit daily by Vercel Cron or GitHub Actions)
export async function GET(request: Request) {
  // In production, you would want to secure this endpoint (e.g. check Authorization header with a secret)
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // 1. Fetch Tasks Due Tomorrow
    const dueTomorrowTasks = await db.task.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow
        },
        status: {
          not: "DONE"
        }
      }
    });

    for (const task of dueTomorrowTasks) {
      await WorkflowEngine.trigger("TASK_DUE_TOMORROW", { taskId: task.id, assigneeId: task.assigneeId, campaignId: task.campaignId, title: task.title });
    }

    // 2. Fetch Tasks Overdue (Due date is before today)
    const overdueTasks = await db.task.findMany({
      where: {
        dueDate: {
          lt: today
        },
        status: {
          not: "DONE"
        }
      }
    });

    for (const task of overdueTasks) {
      await WorkflowEngine.trigger("TASK_OVERDUE", { taskId: task.id, assigneeId: task.assigneeId, campaignId: task.campaignId, title: task.title });
    }

    return NextResponse.json({ 
      success: true, 
      processed: {
        dueTomorrow: dueTomorrowTasks.length,
        overdue: overdueTasks.length
      }
    });
  } catch (error: any) {
    console.error("[CRON] Automations failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
