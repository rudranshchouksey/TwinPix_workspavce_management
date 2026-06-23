"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
const prisma = db as any;
import { requireAuth } from "@/lib/auth-utils";
import { OutreachGeneratorService } from "@/services/ai/outreach-generator.service";
import { generateOutreachInputSchema, GenerateOutreachInput } from "@/lib/validations/outreach";

/** Generates a new outreach draft and persists it. Called for both "Generate" and "Regenerate" — every call adds a new history row. */
export async function generateOutreachAction(input: GenerateOutreachInput) {
  const user = await requireAuth();
  const parsed = generateOutreachInputSchema.parse(input);

  try {
    const service = new OutreachGeneratorService();
    const message = await service.generate(parsed, user.id);

    revalidatePath(`/influencers/${parsed.influencerId}`);

    return { success: true, message };
  } catch (error: any) {
    console.error("[generateOutreachAction] Failed:", error);
    return {
      success: false,
      error: error.message || "Failed to generate outreach message",
    };
  }
}

export async function saveOutreachAsTemplateAction(messageId: string, templateName: string) {
  await requireAuth();

  return prisma.outreachMessage.update({
    where: { id: messageId },
    data: { isTemplate: true, templateName },
  });
}

/** Recent generated drafts for an influencer, newest first. Read-only — never calls the LLM. */
export async function listOutreachMessagesAction(influencerId: string, limit = 10) {
  await requireAuth();

  return prisma.outreachMessage.findMany({
    where: { influencerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      client: { select: { id: true, companyName: true } },
      campaign: { select: { id: true, name: true } },
    },
  });
}
