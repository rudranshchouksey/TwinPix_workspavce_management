"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getUsersListAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Get all users except the current user
    const users = await db.user.findMany({
      where: {
        id: { not: session.user.id },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return users;
  } catch (error) {
    console.error("Failed to get users list", error);
    return [];
  }
}

export async function getConversationAction(otherUserId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: session.user.id },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return messages;
  } catch (error) {
    console.error("Failed to get conversation", error);
    return [];
  }
}

export async function sendMessageAction(receiverId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (!content.trim()) throw new Error("Message cannot be empty");

    const message = await db.message.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        receiverId,
      },
    });

    revalidatePath("/messages");
    return { success: true, message };
  } catch (error: any) {
    console.error("Failed to send message", error);
    return { success: false, error: error.message || "Failed to send message" };
  }
}

export async function markConversationAsReadAction(otherUserId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    await db.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/messages");
  } catch (error) {
    console.error("Failed to mark conversation as read", error);
  }
}
