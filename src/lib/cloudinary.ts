import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TwinPixBot/1.0)' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching image from CDN`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function uploadBuffer(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: publicId, overwrite: true, unique_filename: false },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result.secure_url);
          else reject(new Error('No result returned from Cloudinary'));
        }
      )
      .end(buffer);
  });
}

async function uploadToCloudinary(sourceUrl: string, publicId: string): Promise<string> {
  if (!process.env.CLOUDINARY_URL) return sourceUrl;
  const buffer = await fetchBuffer(sourceUrl);
  return uploadBuffer(buffer, publicId);
}

/**
 * Upload an influencer's profile picture.
 * Public ID: twinpix/influencers/profiles/{instagramHandle}
 * Overwrites on re-sync so URLs remain stable.
 */
export async function uploadProfileImage(
  sourceUrl: string,
  instagramHandle: string
): Promise<string> {
  if (!sourceUrl) return sourceUrl;
  try {
    return await uploadToCloudinary(
      sourceUrl,
      `twinpix/influencers/profiles/${instagramHandle}`
    );
  } catch (error) {
    console.error(`[Cloudinary] Profile upload failed @${instagramHandle}:`, error);
    return sourceUrl;
  }
}

/**
 * Upload a feed post thumbnail.
 * Public ID: twinpix/influencers/posts/{instagramHandle}_{postId}
 */
export async function uploadPostThumbnail(
  sourceUrl: string,
  instagramHandle: string,
  postId: string
): Promise<string> {
  if (!sourceUrl) return sourceUrl;
  try {
    return await uploadToCloudinary(
      sourceUrl,
      `twinpix/influencers/posts/${instagramHandle}_${postId}`
    );
  } catch (error) {
    console.error(`[Cloudinary] Post thumbnail upload failed [${postId}]:`, error);
    return sourceUrl;
  }
}

/**
 * Upload a reel thumbnail.
 * Public ID: twinpix/influencers/reels/{instagramHandle}_{reelId}
 */
export async function uploadReelThumbnail(
  sourceUrl: string,
  instagramHandle: string,
  reelId: string
): Promise<string> {
  if (!sourceUrl) return sourceUrl;
  try {
    return await uploadToCloudinary(
      sourceUrl,
      `twinpix/influencers/reels/${instagramHandle}_${reelId}`
    );
  } catch (error) {
    console.error(`[Cloudinary] Reel thumbnail upload failed [${reelId}]:`, error);
    return sourceUrl;
  }
}
