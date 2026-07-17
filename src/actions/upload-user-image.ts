"use server";

import { requireAuth } from "@/lib/auth-utils";

/**
 * Upload a profile image for a user to Cloudinary.
 * Accepts FormData with `file` (image).
 * Returns the Cloudinary secure_url.
 */
export async function uploadUserImageAction(formData: FormData) {
  await requireAuth();

  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("File is required");
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
    
    // We use a unique ID for the public_id so it doesn't overwrite if not specified
    // Or we could use a timestamp to avoid caching issues
    const uniqueId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const publicId = `twinpix/users/profiles/img_${uniqueId}`;

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
    console.error("[Cloudinary] User profile image upload failed:", error);
    throw new Error(`Image upload failed: ${error.message}`);
  }

  return { url: imageUrl };
}
