import { ScrapedPost, ScrapedReel, ScrapedProfile } from "./instagram-provider";

export class InstagramTransformer {
  /**
   * Transforms raw Apify dataset item representing a profile into a ScrapedProfile.
   * Handles various schema versions from apify/instagram-scraper and apify/instagram-profile-scraper.
   */
  static transformProfile(item: any, defaultUsername: string): ScrapedProfile {
    // Apify might nest profile data in "owner" or it might be flat
    const owner = item.owner || item;

    // Resolve fields across different Apify actor versions
    const username = owner.username || defaultUsername;
    const fullName = owner.full_name || owner.fullName || username;
    const bio = owner.biography || owner.bio || "";
    
    // Followers / Following / Posts
    // Often nested in `edge_followed_by.count` or flat like `followersCount`
    const followersCount = 
      owner.edge_followed_by?.count ?? 
      owner.followersCount ?? 
      item.ownerFollowers ?? 
      0;

    const followingCount = 
      owner.edge_follow?.count ?? 
      owner.followsCount ?? 
      item.ownerFollowing ?? 
      0;

    const postsCount = 
      owner.edge_owner_to_timeline_media?.count ?? 
      owner.postsCount ?? 
      item.ownerPosts ?? 
      0;

    const profileImageUrl = 
      owner.profile_pic_url || 
      owner.profilePicUrl || 
      item.ownerProfilePicUrl || 
      "";

    const externalLink = owner.external_url || owner.externalUrl || "";
    
    let publicEmail = 
      owner.business_email || 
      owner.public_email || 
      owner.email || 
      undefined;

    let publicPhoneNumber = 
      owner.business_phone_number || 
      owner.public_phone_number || 
      owner.contact_phone_number || 
      undefined;

    // Fallback: Extract Email from Bio
    if (!publicEmail && bio) {
      const emailMatch = bio.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        publicEmail = emailMatch[0];
      }
    }

    // Fallback: Extract Phone Number from Bio
    if (!publicPhoneNumber && bio) {
      const phoneMatch = bio.match(/[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/);
      if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 7) {
        publicPhoneNumber = phoneMatch[0].trim();
      }
    }

    return {
      username,
      fullName,
      bio,
      profileImageUrl,
      followersCount,
      followingCount,
      postsCount,
      externalLink,
      publicEmail,
      publicPhoneNumber,
    };
  }

  /**
   * Transforms raw Apify dataset items into arrays of Posts and Reels.
   */
  static transformContent(items: any[]): { posts: ScrapedPost[], reels: ScrapedReel[] } {
    const posts: ScrapedPost[] = [];
    const reels: ScrapedReel[] = [];

    // Flatten posts if they are nested inside a profile item (e.g., from apify/instagram-profile-scraper)
    const allItems = [];
    for (const item of items) {
      if (item.latestPosts && Array.isArray(item.latestPosts)) {
        allItems.push(...item.latestPosts);
      } else {
        allItems.push(item);
      }
    }

    for (const item of allItems) {
      const id = item.id || item.shortcode;
      if (!id) continue;

      const isVideo = item.is_video || item.isVideo;
      // Reel detection: check product_type OR check if it's a Video type in newer schemas
      const isReel = isVideo && (item.product_type === "clips" || item.type === "Video");

      const caption = item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption || "";
      const url = item.display_url || item.displayUrl || item.thumbnail_src || item.thumbnailUrl;
      const likesCount = item.edge_media_preview_like?.count || item.likesCount || 0;
      const commentsCount = item.edge_media_to_comment?.count || item.commentsCount || 0;
      const postUrl = item.shortcode ? `https://www.instagram.com/p/${item.shortcode}/` : item.url;
      const videoViewCount = item.video_view_count || item.videoViewCount || 0;
      
      const timestamp = item.taken_at_timestamp 
        ? new Date(item.taken_at_timestamp * 1000) 
        : item.timestamp 
          ? new Date(item.timestamp) 
          : new Date();

      if (isReel) {
        reels.push({
          id,
          thumbnailUrl: url,
          url: postUrl,
          viewCount: videoViewCount > 0 ? videoViewCount : likesCount * 3, // fallback if missing views
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

    return { posts, reels };
  }
}
