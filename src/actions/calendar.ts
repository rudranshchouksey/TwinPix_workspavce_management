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

  const event = await db.event.create({
    data: {
      ...data,
      userId: user.id,
    },
  });

  revalidatePath("/calendar");
  return event;
}

export async function updateEventAction(id: string, data: any) {
  await requireAuth();

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
