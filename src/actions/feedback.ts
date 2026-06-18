"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitFeedbackAction(subject: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (!subject.trim() || !content.trim()) throw new Error("Subject and content are required");

    const feedback = await db.feedback.create({
      data: {
        subject: subject.trim(),
        content: content.trim(),
        userId: session.user.id,
      },
    });

    revalidatePath("/feedback");
    return { success: true, feedback };
  } catch (error: any) {
    console.error("Failed to submit feedback", error);
    return { success: false, error: error.message || "Failed to submit feedback" };
  }
}

export async function getUserFeedbackAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const feedback = await db.feedback.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return feedback;
  } catch (error) {
    console.error("Failed to fetch feedback", error);
    return [];
  }
}
