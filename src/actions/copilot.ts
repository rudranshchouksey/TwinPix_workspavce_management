"use server";

import { db } from "@/lib/db";
const prisma = db as any;
import { requireAuth } from "@/lib/auth-utils";

export async function listCopilotConversationsAction() {
  const user = await requireAuth();

  return prisma.copilotConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });
}

export async function getCopilotConversationAction(conversationId: string) {
  const user = await requireAuth();

  const conversation = await prisma.copilotConversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation || conversation.userId !== user.id) {
    return null;
  }

  return conversation;
}

export async function deleteCopilotConversationAction(conversationId: string) {
  const user = await requireAuth();

  const conversation = await prisma.copilotConversation.findUnique({
    where: { id: conversationId },
    select: { userId: true },
  });

  if (!conversation || conversation.userId !== user.id) {
    throw new Error("Conversation not found.");
  }

  await prisma.copilotConversation.delete({ where: { id: conversationId } });
}
