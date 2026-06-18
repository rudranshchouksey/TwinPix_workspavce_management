import { ApifyClient } from "apify-client";
import { InstagramProvider, InstagramData, ScrapedPost, ScrapedReel, ScrapedProfile } from "./instagram-provider";

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
    
    // We use the popular apify/instagram-scraper actor
    // This typically requires running a task or an actor
    const run = await this.client.actor("apify/instagram-scraper").call({
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsLimit: 24, // Enough to get ~12 posts and ~12 reels
    });

    console.log(`[ApifyProvider] Run finished for @${username}, fetching dataset items...`);
    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      throw new Error(`Apify returned no data for username: ${username}`);
    }

    if (items[0] && items[0].error) {
      throw new Error(`Apify error: ${items[0].errorDescription || items[0].error}`);
    }

    // The apify/instagram-scraper usually returns the profile data in the first item or attached to posts
    // We will extract profile from the first item and then process posts and reels.
    
    const profileData = items[0] as any;
    
    // Safety check - depending on the exact actor version, the owner data might be nested
    const owner = profileData.owner || profileData;
    
    const profile: ScrapedProfile = {
      username: owner.username || username,
      fullName: owner.full_name || owner.fullName,
      bio: owner.biography || owner.bio,
      profileImageUrl: owner.profile_pic_url || owner.profilePicUrl,
      followersCount: owner.edge_followed_by?.count || owner.followersCount || 0,
      followingCount: owner.edge_follow?.count || owner.followsCount || 0,
      postsCount: owner.edge_owner_to_timeline_media?.count || owner.postsCount || 0,
      externalLink: owner.external_url || owner.externalUrl,
      publicEmail: owner.business_email || owner.public_email || owner.email || undefined,
      publicPhoneNumber: owner.business_phone_number || owner.public_phone_number || owner.contact_phone_number || undefined,
    };

    // Fallback: extract email from bio if not found in structured fields
    if (!profile.publicEmail && profile.bio) {
      const emailMatch = profile.bio.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        profile.publicEmail = emailMatch[0];
      }
    }

    const posts: ScrapedPost[] = [];
    const reels: ScrapedReel[] = [];

    // Process all items in dataset
    for (const item of items) {
      // Basic post parsing
      const isVideo = item.is_video || item.isVideo;
      const isReel = isVideo && (item.product_type === "clips" || item.type === "Video");
      
      const caption = item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption || "";
      const url = item.display_url || item.displayUrl || item.thumbnail_src || item.thumbnailUrl;
      const likesCount = item.edge_media_preview_like?.count || item.likesCount || 0;
      const commentsCount = item.edge_media_to_comment?.count || item.commentsCount || 0;
      const postUrl = item.shortcode ? `https://www.instagram.com/p/${item.shortcode}/` : item.url;
      const videoViewCount = item.video_view_count || item.videoViewCount || 0;
      const id = item.id || item.shortcode;
      
      if (!id) continue;

      const timestamp = item.taken_at_timestamp ? new Date(item.taken_at_timestamp * 1000) : item.timestamp ? new Date(item.timestamp) : new Date();

      if (isReel) {
        reels.push({
          id,
          thumbnailUrl: url,
          url: postUrl,
          viewCount: videoViewCount,
          likesCount,
          commentsCount,
          timestamp,
        });
      } else {
        posts.push({
          id,
          thumbnailUrl: url,
          caption,
          likesCount,
          commentsCount,
          url: postUrl,
          timestamp,
          isVideo,
          videoViewCount,
        });
      }
    }

    // Sort to ensure latest are first
    posts.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    reels.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));

    // Limit to 12 each as requested
    return {
      profile,
      posts: posts.slice(0, 12),
      reels: reels.slice(0, 12),
    };
  }
}
