/**
 * lib/instagram/image-downloader.ts
 *
 * Downloads an Instagram profile image and stores it on Cloudinary CDN.
 * Falls back to the original URL if Cloudinary is not configured or the
 * upload fails, so the scrape-preview flow never blocks on media errors.
 *
 * No filesystem operations are performed.
 */

import { uploadProfileImage } from "@/lib/cloudinary";

/**
 * Upload a profile image to Cloudinary and return the secure CDN URL.
 * Used by the scrape-preview route (no DB persistence).
 *
 * @param imageUrl  - Source URL of the profile image
 * @param username  - Instagram username (used as Cloudinary public ID)
 * @returns Cloudinary secure URL, or the original URL on failure
 */
export async function downloadProfileImage(
  imageUrl: string,
  username: string
): Promise<string> {
  if (!imageUrl) return imageUrl;
  return uploadProfileImage(imageUrl, username);
}
