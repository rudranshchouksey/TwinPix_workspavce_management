"use server";

import { revalidatePath } from "next/cache";
import { db as prisma } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth-utils";

export const NOTIFICATION_DEFAULTS_KEY = "NOTIFICATION_DEFAULTS";

export async function getNotificationDefaultsAction() {
  await requireAuth();
  
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: NOTIFICATION_DEFAULTS_KEY }
    });
    
    if (!setting) return null;
    return setting.value as any;
  } catch (error) {
    console.error("Failed to fetch notification defaults:", error);
    return null;
  }
}

export async function updateNotificationDefaultsAction(value: any) {
  const currentUser = await requireAdmin();

  try {
    await prisma.systemSetting.upsert({
      where: { key: NOTIFICATION_DEFAULTS_KEY },
      update: {
        value,
        updatedBy: currentUser.id
      },
      create: {
        key: NOTIFICATION_DEFAULTS_KEY,
        value,
        updatedBy: currentUser.id
      }
    });

    revalidatePath("/settings/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to update notification defaults:", error);
    throw new Error("Failed to update defaults");
  }
}
