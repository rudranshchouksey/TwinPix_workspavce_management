"use server"

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { logActivity } from "@/actions/activity";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function uploadFileAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;

    if (!entityType) {
      return { success: false, error: "Entity type missing" };
    }
    if (entityType !== "USER" && !entityId) {
      return { success: false, error: "Entity ID missing" };
    }

    // Ensure upload directory exists
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename
    const ext = path.extname(file.name);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    const data: any = {
      fileName: uniqueName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: fileUrl,
      uploadedById: session.user.id,
    };

    if (entityType === "TASK") {
      data.taskId = entityId;
    } else if (entityType === "CAMPAIGN") {
      data.campaignId = entityId;
    } else if (entityType === "INFLUENCER") {
      data.influencerId = entityId;
    }

    const savedFile = await db.file.create({
      data,
    });

    await logActivity({
      userId: session.user.id,
      userName: session.user.name ?? undefined,
      action: "uploaded a file",
      entityType: "FILE",
      entityId: savedFile.id,
      targetName: file.name
    });

    if (entityType === "TASK") {
      revalidatePath(`/tasks/${entityId}`);
    } else if (entityType === "CAMPAIGN") {
      revalidatePath(`/campaigns/${entityId}`);
    } else if (entityType === "INFLUENCER") {
      revalidatePath(`/influencers/${entityId}`);
    } else if (entityType === "USER") {
      revalidatePath(`/files`);
    }

    return { success: true, file: savedFile };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

export async function deleteFileAction(fileId: string, pathname: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const file = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return { success: false, error: "File not found" };
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), "public", file.url);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.warn("File already deleted from disk or not found:", filePath);
    }

    // Delete DB record
    await db.file.delete({
      where: { id: fileId },
    });

    if (pathname) {
      revalidatePath(pathname);
    }
    return { success: true };
  } catch (error) {
    console.error("Delete file error:", error);
    return { success: false, error: "Failed to delete file" };
  }
}

export async function getFilesAction(entityType: string, entityId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const where: any = {};
    if (entityType === "TASK") {
      where.taskId = entityId;
    } else if (entityType === "CAMPAIGN") {
      where.campaignId = entityId;
    } else if (entityType === "INFLUENCER") {
      where.influencerId = entityId;
    }

    const files = await db.file.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    return { success: true, files };
  } catch (error) {
    console.error("Fetch files error:", error);
    return { success: false, error: "Failed to fetch files" };
  }
}

export async function getAllFilesAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const files = await db.file.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        campaign: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        influencer: { select: { id: true, influencerName: true } }
      }
    });

    return { success: true, files };
  } catch (error) {
    console.error("Fetch all files error:", error);
    return { success: false, error: "Failed to fetch files" };
  }
}
