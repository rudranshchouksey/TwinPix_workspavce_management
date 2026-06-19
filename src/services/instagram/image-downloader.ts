import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if CLOUDINARY_URL is available
// Cloudinary automatically picks up process.env.CLOUDINARY_URL
// format: cloudinary://my_key:my_secret@my_cloud_name
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
}

export class ImageDownloader {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure directories exist for local fallback
    if (!fs.existsSync(path.join(this.baseDir, 'profiles'))) {
      fs.mkdirSync(path.join(this.baseDir, 'profiles'), { recursive: true });
    }
    if (!fs.existsSync(path.join(this.baseDir, 'content'))) {
      fs.mkdirSync(path.join(this.baseDir, 'content'), { recursive: true });
    }
  }

  /**
   * Downloads an image from a URL and saves it permanently to Cloudinary (or local fallback).
   * Returns the permanent secure URL (e.g., https://res.cloudinary.com/...)
   * 
   * @param url The remote URL of the image
   * @param type The type of image ('profile' or 'content')
   * @param prefix Optional prefix for the filename (e.g., username or post id)
   */
  async downloadImage(url: string, type: 'profile' | 'content', prefix: string): Promise<string | undefined> {
    if (!url) return undefined;

    try {
      // Fetch the image to a buffer
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
         throw new Error('No response body');
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Cloudinary Upload Strategy
      if (process.env.CLOUDINARY_URL) {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              folder: `twinpix/instagram/${type}`,
              public_id: `${prefix}_${crypto.createHash('md5').update(url).digest('hex').substring(0, 8)}`,
              overwrite: true,
            },
            (error, result) => {
              if (error) {
                console.error(`[ImageDownloader] Cloudinary upload failed:`, error);
                return resolve(url); // Fallback to raw URL
              }
              if (result) {
                return resolve(result.secure_url);
              }
              resolve(url);
            }
          ).end(buffer);
        });
      }

      // Local Fallback Strategy (Works locally, but not persistent on Vercel)
      const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
      let ext = '.jpg';
      try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;
        if (pathname.endsWith('.png')) ext = '.png';
        if (pathname.endsWith('.webp')) ext = '.webp';
        if (pathname.endsWith('.mp4')) ext = '.mp4';
      } catch (e) { }

      const filename = `${prefix}_${hash}${ext}`;
      const relativeFolder = type === 'profile' ? 'profiles' : 'content';
      const localFilePath = path.join(this.baseDir, relativeFolder, filename);
      const publicPath = `/uploads/${relativeFolder}/${filename}`;

      if (fs.existsSync(localFilePath)) {
        return publicPath;
      }

      fs.writeFileSync(localFilePath, buffer);
      return publicPath;

    } catch (error) {
      console.error(`[ImageDownloader] Error downloading image from ${url}:`, error);
      // If download fails, return the original URL as a fallback so we don't lose the image entirely
      return url;
    }
  }
}
