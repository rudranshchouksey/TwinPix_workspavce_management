"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

/**
 * Upload a custom profile image for an influencer to Cloudinary.
 * Accepts FormData with `file` (image) and `influencerId`.
 * Returns the Cloudinary secure_url.
 */
export async function uploadInfluencerImageAction(formData: FormData) {
  const user = await requireAuth();

  const file = formData.get("file") as File | null;
  const influencerId = formData.get("influencerId") as string | null;

  if (!file || !influencerId) {
    throw new Error("File and influencer ID are required");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be smaller than 5MB");
  }

  // Verify influencer exists
  const influencer = await db.influencer.findUnique({
    where: { id: influencerId },
    select: { id: true, instagramHandle: true },
  });

  if (!influencer) {
    throw new Error("Influencer not found");
  }

  // Upload to Cloudinary
  let imageUrl: string;
  try {
    const { v2: cloudinary } = await import("cloudinary");

    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ secure: true });
    } else {
      throw new Error("Cloudinary is not configured");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicId = `twinpix/influencers/custom-profiles/${influencerId}`;

    imageUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            overwrite: true,
            unique_filename: false,
            transformation: [
              { width: 500, height: 500, crop: "fill", gravity: "face" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result.secure_url);
            else reject(new Error("No result returned from Cloudinary"));
          }
        )
        .end(buffer);
    });
  } catch (error: any) {
    console.error("[Cloudinary] Custom profile upload failed:", error);
    throw new Error(`Image upload failed: ${error.message}`);
  }

  // Update DB
  await db.influencer.update({
    where: { id: influencerId },
    data: { profileImage: imageUrl },
  });

  // Audit log (fire-and-forget)
  (db as any).auditLog
    .create({
      data: {
        action: "INFLUENCER_IMAGE_UPDATED",
        entityType: "INFLUENCER",
        entityId: influencerId,
        adminId: user.id,
        details: `Custom profile image uploaded for @${influencer.instagramHandle}`,
      },
    })
    .catch((err: any) => console.warn("[AuditLog] Failed:", err.message));

  revalidatePath("/influencers");
  revalidatePath(`/influencers/${influencerId}`);

  return { url: imageUrl };
}
