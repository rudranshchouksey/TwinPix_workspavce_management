import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';

export class ImageDownloader {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure directories exist
    if (!fs.existsSync(path.join(this.baseDir, 'profiles'))) {
      fs.mkdirSync(path.join(this.baseDir, 'profiles'), { recursive: true });
    }
    if (!fs.existsSync(path.join(this.baseDir, 'content'))) {
      fs.mkdirSync(path.join(this.baseDir, 'content'), { recursive: true });
    }
  }

  /**
   * Downloads an image from a URL and saves it locally.
   * Returns the local public path (e.g., /uploads/profiles/123.jpg)
   * 
   * @param url The remote URL of the image
   * @param type The type of image ('profile' or 'content')
   * @param prefix Optional prefix for the filename (e.g., username or post id)
   */
  async downloadImage(url: string, type: 'profile' | 'content', prefix: string): Promise<string | undefined> {
    if (!url) return undefined;

    try {
      // Generate a unique filename using prefix + hash to avoid long/invalid filenames
      const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
      
      // Determine extension (default to jpg if unknown)
      let ext = '.jpg';
      try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;
        if (pathname.endsWith('.png')) ext = '.png';
        if (pathname.endsWith('.webp')) ext = '.webp';
        if (pathname.endsWith('.mp4')) ext = '.mp4'; // just in case
      } catch (e) {
        // ignore invalid URL parsing for extension
      }

      const filename = `${prefix}_${hash}${ext}`;
      const relativeFolder = type === 'profile' ? 'profiles' : 'content';
      
      const localFilePath = path.join(this.baseDir, relativeFolder, filename);
      const publicPath = `/uploads/${relativeFolder}/${filename}`;

      // Skip download if already exists
      if (fs.existsSync(localFilePath)) {
        return publicPath;
      }

      // Fetch the image
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
         throw new Error('No response body');
      }

      // Convert Web Stream to Node stream
      // Node 18+ fetch returns a ReadableStream
      const fileStream = fs.createWriteStream(localFilePath);
      
      // @ts-ignore - Node 18+ fetch body is a ReadableStream which can be handled by pipeline in newer versions, or we can use array buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      fs.writeFileSync(localFilePath, buffer);

      return publicPath;
    } catch (error) {
      console.error(`[ImageDownloader] Error downloading image from ${url}:`, error);
      // If download fails, return the original URL as a fallback so we don't lose the image entirely
      return url;
    }
  }
}
