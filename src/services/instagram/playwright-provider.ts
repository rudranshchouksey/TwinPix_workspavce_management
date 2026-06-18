import { InstagramProvider, InstagramData, ScrapedPost, ScrapedReel, ScrapedProfile } from "./instagram-provider";
import { createBrowserSession } from "./core/browser";
import { scrapeProfile } from "./scrapers/profile";
import { scrapeRecentPosts } from "./scrapers/feed";
import { scrapeRecentReels } from "./scrapers/reels";

export class PlaywrightProvider implements InstagramProvider {
  async fetchInfluencerData(username: string): Promise<InstagramData> {
    console.log(`[PlaywrightProvider] Starting scrape for @${username}`);
    
    const session = await createBrowserSession();
    try {
      console.log(`[PlaywrightProvider] Browser launched. Scraping profile...`);
      const profileData = await scrapeProfile(session.page, username);
      if (!profileData) {
        throw new Error(`Failed to scrape profile for ${username}. Playwright may have hit a login wall.`);
      }
      
      const profile: ScrapedProfile = {
        username: profileData.username,
        fullName: profileData.fullName,
        bio: profileData.bio,
        profileImageUrl: profileData.profileImageUrl,
        followersCount: profileData.followersCount,
        followingCount: profileData.followingCount,
        postsCount: profileData.postsCount,
      };

      console.log(`[PlaywrightProvider] Scraping feed...`);
      const rawPosts = await scrapeRecentPosts(session.page, username);
      
      const posts: ScrapedPost[] = rawPosts.map(p => ({
        id: p.postId,
        thumbnailUrl: p.thumbnailUrl,
        caption: p.caption,
        likesCount: p.likesCount || 0,
        commentsCount: p.commentsCount || 0,
        url: p.postUrl,
      }));

      console.log(`[PlaywrightProvider] Scraping reels...`);
      const rawReels = await scrapeRecentReels(session.page, username);
      
      const reels: ScrapedReel[] = rawReels.map(r => ({
        id: r.reelId,
        thumbnailUrl: r.thumbnailUrl,
        url: r.reelUrl,
        viewCount: r.viewsCount || 0,
        likesCount: r.likesCount || 0,
        commentsCount: r.commentsCount || 0,
      }));

      return {
        profile,
        posts,
        reels,
      };
    } finally {
      await session.close();
    }
  }
}
