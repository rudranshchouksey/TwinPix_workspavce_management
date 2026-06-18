import { ApifyClient } from "apify-client";
import { InstagramProvider, InstagramData, ScrapedPost, ScrapedReel, ScrapedProfile } from "./instagram-provider";
import { InstagramTransformer } from "./instagram-transformer";

export class ApifyProvider implements InstagramProvider {
  private client: ApifyClient;

  constructor(token?: string) {
    const apiToken = token || process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      throw new Error("APIFY_API_TOKEN is not set. ApifyProvider requires an API token.");
    }
    this.client = new ApifyClient({ token: apiToken });
  }

  async fetchInfluencerData(username: string): Promise<InstagramData> {
    console.log(`[ApifyProvider] Starting scrape for @${username}`);
    let items: any[] = [];
    
    try {
      console.log(`[ApifyProvider] Attempt 1: Using apify/instagram-profile-scraper (more resilient)...`);
      const run = await this.client.actor("apify/instagram-profile-scraper").call({
        usernames: [username],
      });
      const dataset = await this.client.dataset(run.defaultDatasetId).listItems();
      items = dataset.items;

      if (!items || items.length === 0 || items[0].error) {
        throw new Error(items[0]?.errorDescription || items[0]?.error || "Empty dataset");
      }
    } catch (e: any) {
      console.warn(`[ApifyProvider] Profile scraper failed: ${e.message}. Attempt 2: Using apify/instagram-scraper...`);
      const run = await this.client.actor("apify/instagram-scraper").call({
        directUrls: [`https://www.instagram.com/${username}/`],
        resultsLimit: 24, // Enough to get ~12 posts and ~12 reels
      });
      const dataset = await this.client.dataset(run.defaultDatasetId).listItems();
      items = dataset.items;
    }

    if (!items || items.length === 0) {
      throw new Error(`Apify returned no data for username: ${username}`);
    }

    if (items[0] && items[0].error) {
      throw new Error(`Apify error: ${items[0].errorDescription || items[0].error}`);
    }

    // The apify/instagram-scraper usually returns the profile data in the first item or attached to posts
    // We will extract profile from the first item and then process posts and reels.
    
    const profileData = items[0] as any;
    const profile = InstagramTransformer.transformProfile(profileData, username);
    const { posts, reels } = InstagramTransformer.transformContent(items);

    // Limit to 12 each as requested
    return {
      profile,
      posts: posts.slice(0, 12),
      reels: reels.slice(0, 12),
    };
  }
}
