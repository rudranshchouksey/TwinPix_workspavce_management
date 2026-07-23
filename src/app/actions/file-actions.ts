"use server"

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { logActivity } from "@/actions/activity";

// Configure Cloudinary from CLOUDINARY_URL env var
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
}

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 * Falls back to a data URI if Cloudinary is not configured.
 */
function uploadBufferToCloudinary(
  buffer: Buffer,
  publicId: string,
  resourceType: "image" | "raw" | "auto" = "auto"
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          unique_filename: false,
          resource_type: resourceType,
          folder: "twinpix/files",
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result.secure_url);
          else reject(new Error("No result returned from Cloudinary"));
        }
      )
      .end(buffer);
  });
}

/**
 * Extract the Cloudinary public ID from a URL for deletion.
 */
function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(twinpix\/.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

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

    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate a unique public ID for Cloudinary
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.\w+$/, "");
    const publicId = `${entityType.toLowerCase()}/${entityId || session.user.id}/${timestamp}_${safeName}`;

    let fileUrl: string;

    if (process.env.CLOUDINARY_URL) {
      // Production: upload to Cloudinary
      fileUrl = await uploadBufferToCloudinary(buffer, publicId);
    } else {
      // Fallback for development without Cloudinary: use /tmp (still won't persist on Vercel)
      console.warn("[file-actions] CLOUDINARY_URL not set — file upload will not persist in production");
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");
      const tmpDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(tmpDir, { recursive: true });
      const uniqueName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(tmpDir, uniqueName);
      await writeFile(filePath, buffer);
      fileUrl = `/uploads/${uniqueName}`;
    }

    const data: Record<string, string | number> = {
      fileName: publicId,
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
      await db.taskActivity.create({
        data: {
          taskId: entityId,
          userId: session.user.id,
          type: "ATTACHMENT_ADDED",
          details: `attached ${file.name}`
        }
      });
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

    // Delete from Cloudinary if the URL is a Cloudinary URL
    if (file.url.includes("cloudinary.com")) {
      const publicId = extractPublicId(file.url);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
        } catch (_err) {
          console.warn("[file-actions] Cloudinary delete failed for:", publicId);
        }
      }
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

    const where: Record<string, string> = {};
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
