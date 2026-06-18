/**
 * lib/instagram/image-downloader.ts
 *
 * Downloads Instagram profile images and stores them locally
 * in the uploads/profile-images directory.
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";

/** Directory where profile images are stored */
const PROFILE_IMAGES_DIR = path.join(process.cwd(), "uploads", "profile-images");

/**
 * Download a profile image from a URL and save it locally.
 * Returns the API-accessible path for the saved image.
 *
 * @param imageUrl - The URL of the profile image to download
 * @param username - The Instagram username (used in filename)
 * @returns The local API path, e.g., "/api/uploads/profile-images/username_1234567890.jpg"
 */
export async function downloadProfileImage(
  imageUrl: string,
  username: string
): Promise<string> {
  try {
    // Ensure directory exists
    await mkdir(PROFILE_IMAGES_DIR, { recursive: true });

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: "https://www.instagram.com/",
      },
    });

    if (!response.ok) {
      console.warn(
        `[Instagram] Failed to download profile image for @${username}: HTTP ${response.status}`
      );
      return imageUrl; // Return original URL as fallback
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

    const timestamp = Date.now();
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${sanitizedUsername}_${timestamp}.${extension}`;
    const filepath = path.join(PROFILE_IMAGES_DIR, filename);

    // Get the image data as buffer and write to disk
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    // Return the API route path (not filesystem path)
    return `/api/uploads/profile-images/${filename}`;
  } catch (error) {
    console.warn(
      `[Instagram] Error downloading profile image for @${username}:`,
      error
    );
    // Return the original URL as fallback so the import still succeeds
    return imageUrl;
  }
}
