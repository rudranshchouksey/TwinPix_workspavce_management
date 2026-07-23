"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function getActiveTimerAction() {
  const user = await requireAuth();
  
  const timer = await db.activeTimer.findUnique({
    where: { userId: user.id },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          campaignId: true,
        }
      }
    }
  });

  return timer;
}

export async function startTimerAction(taskId: string) {
  const user = await requireAuth();

  // Check if they already have an active timer
  const existing = await db.activeTimer.findUnique({ where: { userId: user.id } });
  
  if (existing) {
    if (existing.taskId === taskId && !existing.isPaused) {
      return existing; // Already running for this task
    }
    // If they have a timer running for another task, we should theoretically stop it first.
    // For simplicity, we will just stop it and save the entry.
    await stopTimerAction();
  }

  const timer = await db.activeTimer.create({
    data: {
      userId: user.id,
      taskId,
      startTime: new Date(),
      lastPingAt: new Date(),
      pausedTotalMinutes: 0,
      isPaused: false,
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          campaignId: true,
        }
      }
    }
  });

  revalidatePath(`/tasks/${taskId}`);
  return timer;
}

export async function pauseTimerAction() {
  const user = await requireAuth();
  const existing = await db.activeTimer.findUnique({ where: { userId: user.id } });
  
  if (!existing || existing.isPaused) return existing;

  const now = new Date();
  const minutesSincePing = Math.floor((now.getTime() - existing.lastPingAt.getTime()) / 60000);

  const updated = await db.activeTimer.update({
    where: { userId: user.id },
    data: {
      isPaused: true,
      lastPingAt: now,
    }
  });

  return updated;
}

export async function resumeTimerAction() {
  const user = await requireAuth();
  const existing = await db.activeTimer.findUnique({ where: { userId: user.id } });
  
  if (!existing || !existing.isPaused) return existing;

  // When resuming, we consider the time between lastPingAt and now as "paused time"
  const now = new Date();
  const pausedMinutes = Math.floor((now.getTime() - existing.lastPingAt.getTime()) / 60000);

  const updated = await db.activeTimer.update({
    where: { userId: user.id },
    data: {
      isPaused: false,
      lastPingAt: now,
      pausedTotalMinutes: existing.pausedTotalMinutes + pausedMinutes
    }
  });

  return updated;
}

export async function stopTimerAction() {
  const user = await requireAuth();
  const existing = await db.activeTimer.findUnique({ where: { userId: user.id } });
  
  if (!existing) return null;

  const now = new Date();
  
  // Calculate total duration
  let endTime = now;
  if (existing.isPaused) {
    endTime = existing.lastPingAt; // The work stopped when they paused
  }

  const totalElapsedMs = endTime.getTime() - existing.startTime.getTime();
  const totalElapsedMinutes = Math.floor(totalElapsedMs / 60000);
  const activeMinutes = Math.max(0, totalElapsedMinutes - existing.pausedTotalMinutes);

  // If activeMinutes > 0, create a TimeEntry
  if (activeMinutes > 0) {
    await db.timeEntry.create({
      data: {
        userId: user.id,
        taskId: existing.taskId,
        startTime: existing.startTime,
        endTime: endTime,
        durationMinutes: activeMinutes,
        description: "Tracked via timer",
        isManual: false,
      }
    });

    // Also update the task's actualHours
    const task = await db.task.findUnique({ where: { id: existing.taskId } });
    if (task) {
      const addedHours = activeMinutes / 60;
      await db.task.update({
        where: { id: task.id },
        data: {
          actualHours: (task.actualHours || 0) + addedHours
        }
      });
    }
  }

  // Delete the active timer
  await db.activeTimer.delete({ where: { userId: user.id } });

  revalidatePath(`/tasks/${existing.taskId}`);
  revalidatePath("/timesheets");
  
  return null;
}

export async function addManualTimeEntryAction(taskId: string, durationMinutes: number, description: string, startTimeStr: string) {
  const user = await requireAuth();
  
  const startTime = new Date(startTimeStr);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  const entry = await db.timeEntry.create({
    data: {
      userId: user.id,
      taskId,
      startTime,
      endTime,
      durationMinutes,
      description,
      isManual: true,
    }
  });

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (task) {
    const addedHours = durationMinutes / 60;
    await db.task.update({
      where: { id: task.id },
      data: {
        actualHours: (task.actualHours || 0) + addedHours
      }
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/timesheets");

  return entry;
}

export async function getTaskTimeEntriesAction(taskId: string) {
  return await db.timeEntry.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true, image: true, email: true } }
    },
    orderBy: { startTime: 'desc' }
  });
}
