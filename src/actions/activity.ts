"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

export async function logActivity({
  userId,
  userName,
  action,
  entityType,
  entityId,
  targetName,
  details
}: {
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  targetName?: string;
  details?: string;
}) {
  try {
    await db.activityLog.create({
      data: {
        userId,
        userName,
        action,
        entityType,
        entityId,
        targetName,
        details
      }
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getActivityLogsAction(take = 20) {
  await requireAuth();
  
  return db.activityLog.findMany({
    take,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    }
  });
}
