import { db } from "@/lib/db";
import { ApifyProvider } from "./apify-provider";
import { PlaywrightProvider } from "./playwright-provider";
import { MockProvider } from "./mock-provider";
import { ImageDownloader } from "./image-downloader";

export interface SyncResult {
  success: boolean;
  source: "apify" | "playwright" | "mock";
  profile: {
    name: string | null;
    followers: number;
    following: number;
    posts: number;
    email: string | null;
  };
  contentSynced: {
    posts: number;
    reels: number;
  };
  analytics: {
    engagementRate: number;
    avgReelViews: number;
    avgPostLikes: number;
    avgPostComments: number;
  };
  errors: string[];
}

export class InstagramSyncService {
  private apify: ApifyProvider | null = null;
  private playwright: PlaywrightProvider;
  private mock: MockProvider;
  private imageDownloader: ImageDownloader;

  constructor() {
    this.playwright = new PlaywrightProvider();
    this.mock = new MockProvider();
    this.imageDownloader = new ImageDownloader();
    
    try {
      this.apify = new ApifyProvider();
    } catch (e) {
      console.warn("[InstagramSyncService] ApifyProvider not initialized. Missing API Token. Will use Playwright fallback exclusively.");
    }
  }

  async syncInfluencer(influencerId: string): Promise<SyncResult> {
    const prisma = db as any;
    const errors: string[] = [];
    let dataSource: "apify" | "playwright" | "mock" = "mock";
    
    // ─── Step 1: Fetch influencer from DB ───────────────────────
    console.log(`[Sync:1/6] Fetching influencer ${influencerId} from database...`);
    
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId }
    });

    if (!influencer || !influencer.instagramHandle) {
      throw new Error(`Influencer not found or missing instagram handle for ID: ${influencerId}`);
    }

    const username = influencer.instagramHandle;
    let instagramData;

    // ─── Step 2: Fetch Instagram data ───────────────────────────
    console.log(`[Sync:2/6] Fetching Instagram data for @${username}...`);

    try {
      if (this.apify) {
        instagramData = await this.apify.fetchInfluencerData(username);
        dataSource = "apify";
        console.log(`[Sync:2/6] ✓ Apify provider succeeded.`);
      } else {
        throw new Error("Apify not configured");
      }
    } catch (error: any) {
      errors.push(`Apify failed: ${error.message}`);
      console.warn(`[Sync:2/6] Apify failed: ${error.message}. Trying Playwright...`);
      try {
        instagramData = await this.playwright.fetchInfluencerData(username);
        dataSource = "playwright";
        console.log(`[Sync:2/6] ✓ Playwright provider succeeded.`);
      } catch (playwrightError: any) {
        errors.push(`Playwright failed: ${playwrightError.message}`);
        console.warn(`[Sync:2/6] Playwright failed: ${playwrightError.message}. No providers left. Extracting from DB...`);
        // We do NOT use MockProvider. We let it fail so the defensive fallback works.
        throw new Error("All data providers failed to fetch live Instagram data.");
      }
    }

    if (!instagramData) {
      throw new Error("Failed to fetch data from all providers");
    }

    console.log(`[Sync:2/6] Raw data: ${instagramData.posts.length} posts, ${instagramData.reels.length} reels, followers=${instagramData.profile.followersCount}`);

    // ─── Step 3: Download Profile Image ─────────────────────────
    console.log(`[Sync:3/6] Processing profile image...`);
    
    let localProfileImagePath = influencer.profileImage;
    if (instagramData.profile.profileImageUrl) {
       try {
         localProfileImagePath = await this.imageDownloader.downloadImage(
           instagramData.profile.profileImageUrl, 
           'profile', 
           username
         ) || localProfileImagePath;
         console.log(`[Sync:3/6] ✓ Profile image saved: ${localProfileImagePath}`);
       } catch (imgError: any) {
         errors.push(`Image download failed: ${imgError.message}`);
         console.warn(`[Sync:3/6] ✗ Image download failed, keeping existing.`);
       }
    }

    // ─── Step 4: Extract contact info ───────────────────────────
    console.log(`[Sync:4/6] Extracting contact information...`);
    
    // Extract email from structured data or bio
    let extractedEmail = instagramData.profile.publicEmail || influencer.email;
    if (!extractedEmail && instagramData.profile.bio) {
      const emailMatch = instagramData.profile.bio.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        extractedEmail = emailMatch[0];
        console.log(`[Sync:4/6] ✓ Email extracted from bio: ${extractedEmail}`);
      }
    }

    // Extract phone from structured data or bio
    let extractedPhone = instagramData.profile.publicPhoneNumber || influencer.phoneNumber;
    if (!extractedPhone && instagramData.profile.bio) {
      const phoneMatch = instagramData.profile.bio.match(/[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/);
      if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 7) {
        extractedPhone = phoneMatch[0].trim();
        console.log(`[Sync:4/6] ✓ Phone extracted from bio: ${extractedPhone}`);
      }
    }

    console.log(`[Sync:4/6] Contact: email=${extractedEmail || 'none'}, phone=${extractedPhone || 'none'}`);

    // ─── Step 5: Update Profile in DB ───────────────────────────
    console.log(`[Sync:5/6] Updating influencer profile in database...`);
    
    const safeFollowers = instagramData.profile.followersCount > 0 ? instagramData.profile.followersCount : influencer.followers;
    const safeFollowing = instagramData.profile.followingCount > 0 ? instagramData.profile.followingCount : influencer.following;
    const safePostsCount = instagramData.profile.postsCount > 0 ? instagramData.profile.postsCount : influencer.posts;

    await prisma.influencer.update({
      where: { id: influencerId },
      data: {
        influencerName: instagramData.profile.fullName || influencer.influencerName,
        profileDescription: instagramData.profile.bio || influencer.profileDescription,
        profileImage: localProfileImagePath,
        followers: safeFollowers,
        following: safeFollowing,
        posts: safePostsCount,
        profileLink: instagramData.profile.externalLink || influencer.profileLink,
        email: extractedEmail,
        phoneNumber: extractedPhone,
        lastSyncDate: new Date(),
      }
    });

    // ─── Process Posts ───────────────────────────────────────────
    let postsSynced = 0;
    for (const post of instagramData.posts) {
      try {
        let localThumbnail: string | undefined = undefined;
        if (post.thumbnailUrl) {
           localThumbnail = await this.imageDownloader.downloadImage(
             post.thumbnailUrl, 
             'content', 
             `post_${post.id}`
           );
        }

        await prisma.influencerPost.upsert({
          where: { instagramPostId: post.id },
          create: {
            influencerId,
            instagramPostId: post.id,
            thumbnail: localThumbnail || post.thumbnailUrl,
            caption: post.caption,
            likes: post.likesCount,
            comments: post.commentsCount,
            postUrl: post.url,
            publishedDate: post.timestamp || new Date(),
          },
          update: {
            thumbnail: localThumbnail || post.thumbnailUrl,
            caption: post.caption,
            likes: post.likesCount,
            comments: post.commentsCount,
          }
        });
        postsSynced++;
      } catch (postError: any) {
        errors.push(`Post ${post.id}: ${postError.message}`);
      }
    }

    // ─── Process Reels ──────────────────────────────────────────
    let reelsSynced = 0;
    for (const reel of instagramData.reels) {
      try {
        let localThumbnail: string | undefined = undefined;
        if (reel.thumbnailUrl) {
           localThumbnail = await this.imageDownloader.downloadImage(
             reel.thumbnailUrl, 
             'content', 
             `reel_${reel.id}`
           );
        }

        await prisma.influencerReel.upsert({
          where: { instagramReelId: reel.id },
          create: {
            influencerId,
            instagramReelId: reel.id,
            thumbnail: localThumbnail || reel.thumbnailUrl,
            reelUrl: reel.url,
            views: reel.viewCount,
            likes: reel.likesCount,
            comments: reel.commentsCount,
            publishedDate: reel.timestamp || new Date(),
          },
          update: {
            thumbnail: localThumbnail || reel.thumbnailUrl,
            views: reel.viewCount,
            likes: reel.likesCount,
            comments: reel.commentsCount,
          }
        });
        reelsSynced++;
      } catch (reelError: any) {
        errors.push(`Reel ${reel.id}: ${reelError.message}`);
      }
    }

    console.log(`[Sync:5/6] ✓ Synced ${postsSynced} posts and ${reelsSynced} reels.`);

    // ─── Step 6: Compute & Save Analytics ───────────────────────
    console.log(`[Sync:6/6] Computing content analytics...`);
    
    const allPosts = instagramData.posts;
    const allReels = instagramData.reels;
    
    // Use the UPDATED safe followers count (fallback to existing if scraper fails)
    const updatedFollowers = safeFollowers;
    
    let totalEngagements = 0;
    let totalPostLikes = 0;
    let totalPostComments = 0;
    let topPost = null;
    let topReel = null;

    if (allPosts.length > 0) {
      for (const p of allPosts) {
        totalEngagements += p.likesCount + p.commentsCount;
        totalPostLikes += p.likesCount;
        totalPostComments += p.commentsCount;
      }
      topPost = [...allPosts].sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount))[0];
    }

    if (allReels.length > 0) {
      topReel = [...allReels].sort((a, b) => b.viewCount - a.viewCount)[0];
    }

    // Calculate engagement rate using updated followers
    const avgEngagementRate = updatedFollowers > 0 
      ? ((totalEngagements / Math.max(1, allPosts.length)) / updatedFollowers) * 100 
      : 0;

    const avgPostLikes = allPosts.length > 0 ? Math.floor(totalPostLikes / allPosts.length) : 0;
    const avgPostComments = allPosts.length > 0 ? Math.floor(totalPostComments / allPosts.length) : 0;

    const totalReelViews = allReels.reduce((acc, r) => acc + r.viewCount, 0);
    const avgReelViews = allReels.length > 0 ? Math.floor(totalReelViews / allReels.length) : 0;

    // Save analytics record
    await prisma.influencerContentAnalytics.upsert({
      where: { influencerId },
      create: {
        influencerId,
        avgEngagementRate,
        avgReelViews,
        avgPostLikes,
        avgPostComments,
        topPostId: topPost?.id,
        topReelId: topReel?.id,
        updatedAt: new Date(),
        aiInsights: [
          `Consistency: Analyzed ${allPosts.length} recent posts and ${allReels.length} reels.`,
          `Engagement: Average engagement rate is ${avgEngagementRate.toFixed(2)}%.`,
          `Reach: Reels average ${avgReelViews.toLocaleString()} views.`,
          `Content: Average ${avgPostLikes.toLocaleString()} likes and ${avgPostComments.toLocaleString()} comments per post.`,
        ]
      },
      update: {
        avgEngagementRate,
        avgReelViews,
        avgPostLikes,
        avgPostComments,
        topPostId: topPost?.id,
        topReelId: topReel?.id,
        updatedAt: new Date(),
        aiInsights: [
          `Consistency: Analyzed ${allPosts.length} recent posts and ${allReels.length} reels.`,
          `Engagement: Average engagement rate is ${avgEngagementRate.toFixed(2)}%.`,
          `Reach: Reels average ${avgReelViews.toLocaleString()} views.`,
          `Content: Average ${avgPostLikes.toLocaleString()} likes and ${avgPostComments.toLocaleString()} comments per post.`,
        ]
      }
    });

    // ─── CRITICAL FIX: Write engagement rate back to Influencer model ───
    await prisma.influencer.update({
      where: { id: influencerId },
      data: {
        engagementRate: Math.round(avgEngagementRate * 100) / 100,
      }
    });

    console.log(`[Sync:6/6] ✓ Analytics computed: engagement=${avgEngagementRate.toFixed(2)}%, avgViews=${avgReelViews}, avgLikes=${avgPostLikes}`);
    console.log(`[Sync] ✓ Sync complete for @${username} via ${dataSource}. ${errors.length > 0 ? `(${errors.length} non-fatal errors)` : ''}`);

    return {
      success: true,
      source: dataSource,
      profile: {
        name: instagramData.profile.fullName || null,
        followers: instagramData.profile.followersCount,
        following: instagramData.profile.followingCount,
        posts: instagramData.profile.postsCount,
        email: extractedEmail,
      },
      contentSynced: {
        posts: postsSynced,
        reels: reelsSynced,
      },
      analytics: {
        engagementRate: avgEngagementRate,
        avgReelViews,
        avgPostLikes,
        avgPostComments,
      },
      errors,
    };
  }
}
