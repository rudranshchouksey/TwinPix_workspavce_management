"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function uploadFileAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const campaignId = formData.get("campaignId") as string | null;
    const taskId = formData.get("taskId") as string | null;
    const folder = formData.get("folder") as string || "Documents";

    if (!file) {
      throw new Error("File is required");
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new Error("File must be smaller than 50MB");
    }

    // Upload to Cloudinary
    let secureUrl: string;
    const { v2: cloudinary } = await import("cloudinary");

    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ secure: true });
    } else {
      throw new Error("Cloudinary is not configured");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const publicId = `twinpix/projects/files/${uniqueId}`;

    secureUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            resource_type: "auto",
            overwrite: true,
            unique_filename: false,
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result.secure_url);
            else reject(new Error("No result returned from Cloudinary"));
          }
        )
        .end(buffer);
    });

    // Create DB Record
    const dbFile = await db.file.create({
      data: {
        fileName: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: secureUrl,
        folder,
        uploadedById: session.user.id,
        projectId: projectId || null,
        campaignId: campaignId || null,
        taskId: taskId || null,
      }
    });

    await db.fileActivity.create({
      data: {
        fileId: dbFile.id,
        userId: session.user.id,
        type: "UPLOADED",
        details: "File uploaded successfully"
      }
    });

    if (projectId) revalidatePath(`/projects/${projectId}`);
    return { success: true, file: dbFile };
  } catch (error: any) {
    console.error("[File Upload] Failed:", error);
    return { success: false, error: error.message || "File upload failed" };
  }
}

export async function addFileCommentAction(fileId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    if (!content.trim()) return { success: false, error: "Comment is empty" };

    const comment = await db.fileComment.create({
      data: {
        content: content.trim(),
        fileId,
        userId: session.user.id
      },
      include: {
        user: true
      }
    });

    await db.fileActivity.create({
      data: {
        fileId,
        userId: session.user.id,
        type: "COMMENTED",
        details: "Added a comment"
      }
    });

    // We rely on caller to know which path to revalidate or use optimistic UI
    return { success: true, comment };
  } catch (error: any) {
    console.error("Failed to add comment", error);
    return { success: false, error: error.message };
  }
}

export async function updateFileAction(fileId: string, data: { tags?: string[]; folder?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const updated = await db.file.update({
      where: { id: fileId },
      data: {
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.folder !== undefined && { folder: data.folder }),
      }
    });

    return { success: true, file: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFileAction(fileId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await db.file.delete({ where: { id: fileId } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
