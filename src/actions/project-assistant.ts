"use server";

import { auth } from "@/lib/auth";
import { ProjectAssistantService } from "@/services/ai/project-assistant.service";

const service = new ProjectAssistantService();

export async function analyzeProjectAction(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const result = await service.analyzeProject(projectId);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("AI analysis failed:", error);
    return { success: false, error: error.message || "AI analysis failed" };
  }
}

export async function generateWeeklyReportAction(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const report = await service.generateWeeklyReport(projectId);
    return { success: true, data: report };
  } catch (error: any) {
    console.error("Weekly report generation failed:", error);
    return { success: false, error: error.message || "Report generation failed" };
  }
}

export async function identifyRisksAction(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const result = await service.identifyRisks(projectId);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Risk identification failed:", error);
    return { success: false, error: error.message || "Risk identification failed" };
  }
}

export async function suggestActionsAction(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const result = await service.suggestActions(projectId);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Action suggestion failed:", error);
    return { success: false, error: error.message || "Action suggestion failed" };
  }
}
