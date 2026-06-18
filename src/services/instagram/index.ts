import { createBrowserSession } from "./core/browser";
import { scrapeProfile, InstagramProfileData } from "./scrapers/profile";
import { scrapeRecentPosts, InstagramPostData } from "./scrapers/feed";
import { scrapeRecentReels, InstagramReelData } from "./scrapers/reels";

export interface InstagramFullProfile {
  profile: InstagramProfileData;
  posts: InstagramPostData[];
  reels: InstagramReelData[];
}

/**
 * Orchestrates the full scraping workflow for a given Instagram handle.
 * Includes profile metrics, recent feed posts, and recent reels.
 */
export async function fetchFullInstagramProfile(handle: string): Promise<InstagramFullProfile | null> {
  const session = await createBrowserSession();
  
  try {
    console.log(`[Sync] Starting sync for @${handle}`);
    
    const profile = await scrapeProfile(session.page, handle);
    if (!profile) {
      console.error(`[Sync] Failed to retrieve profile for @${handle}`);
      return null;
    }

    const posts = await scrapeRecentPosts(session.page, handle);
    const reels = await scrapeRecentReels(session.page, handle);

    console.log(`[Sync] Successfully synced @${handle}: ${posts.length} posts, ${reels.length} reels`);

    return {
      profile,
      posts,
      reels,
    };
  } catch (error) {
    console.error(`[Sync] Critical failure syncing @${handle}:`, error);
    return null;
  } finally {
    await session.close();
  }
}
