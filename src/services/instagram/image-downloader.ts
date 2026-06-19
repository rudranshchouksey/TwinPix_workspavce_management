import {
  uploadProfileImage,
  uploadPostThumbnail,
  uploadReelThumbnail,
} from '@/lib/cloudinary';

/**
 * Thin service wrapper over the Cloudinary lib used by the sync service.
 * No filesystem operations — all media is uploaded to Cloudinary CDN.
 * Falls back to the original source URL if Cloudinary is not configured
 * or if an upload error occurs.
 */
export class ImageDownloader {
  async downloadProfileImage(
    url: string,
    instagramHandle: string
  ): Promise<string | undefined> {
    if (!url) return undefined;
    return uploadProfileImage(url, instagramHandle);
  }

  async downloadPostThumbnail(
    url: string,
    instagramHandle: string,
    postId: string
  ): Promise<string | undefined> {
    if (!url) return undefined;
    return uploadPostThumbnail(url, instagramHandle, postId);
  }

  async downloadReelThumbnail(
    url: string,
    instagramHandle: string,
    reelId: string
  ): Promise<string | undefined> {
    if (!url) return undefined;
    return uploadReelThumbnail(url, instagramHandle, reelId);
  }
}
