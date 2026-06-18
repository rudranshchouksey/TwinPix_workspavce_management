"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getProjectsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, companyName: true },
        },
        campaigns: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    return projects;
  } catch (error) {
    console.error("Failed to fetch projects", error);
    return [];
  }
}

export async function createProjectAction(input: {
  name: string;
  description?: string;
  clientId?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (!input.name.trim()) throw new Error("Project name is required");

    const project = await db.project.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim(),
        clientId: input.clientId || null,
      },
    });

    revalidatePath("/projects");
    return { success: true, project };
  } catch (error: any) {
    console.error("Failed to create project", error);
    return { success: false, error: error.message || "Failed to create project" };
  }
}

export async function updateProjectStatusAction(id: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const project = await db.project.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/projects");
    return { success: true, project };
  } catch (error: any) {
    console.error("Failed to update project", error);
    return { success: false, error: error.message || "Failed to update project" };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await db.project.delete({
      where: { id },
    });

    revalidatePath("/projects");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete project", error);
    return { success: false, error: error.message || "Failed to delete project" };
  }
}
