import { db } from "@/lib/db";
import { ApifyProvider } from "./apify-provider";
import { MockProvider } from "./mock-provider";
import {
  uploadProfileImage,
  uploadPostThumbnail,
  uploadReelThumbnail,
} from "@/lib/cloudinary";

export interface SyncResult {
  success: boolean;
  source: "apify" | "mock";
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
  aiInsightsGenerated: boolean;
  errors: string[];
}

export class InstagramSyncService {
  private apify: ApifyProvider | null = null;
  private mock: MockProvider;

  constructor() {
    this.mock = new MockProvider();

    try {
      this.apify = new ApifyProvider();
    } catch (e) {
      console.warn("[InstagramSyncService] ApifyProvider not initialized. Missing API Token.");
    }
  }

  async syncInfluencer(influencerId: string): Promise<SyncResult> {
    const prisma = db as any;
    const errors: string[] = [];
    let dataSource: "apify" | "mock" = "mock";

    // ─── Step 1: Fetch influencer from DB ───────────────────────
    console.log(`[Sync:1/7] Fetching influencer ${influencerId} from database...`);

    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
    });

    if (!influencer || !influencer.instagramHandle) {
      await prisma.influencer.update({
        where: { id: influencerId },
        data: { syncStatus: "FAILED", syncProgress: "Missing Instagram handle" }
      }).catch(() => {});
      throw new Error(`Influencer not found or missing instagram handle for ID: ${influencerId}`);
    }

    const username = influencer.instagramHandle;

    await prisma.influencer.update({
      where: { id: influencerId },
      data: { syncStatus: "RUNNING", syncProgress: "Fetching Instagram data..." }
    });

    let instagramData;

    // ─── Step 2: Fetch Instagram data ───────────────────────────
    console.log(`[Sync:2/7] Fetching Instagram data for @${username}...`);

    let retryCount = 0;
    const maxRetries = 3;
    let lastError = null;

    while (retryCount < maxRetries && !instagramData) {
      try {
        if (this.apify) {
          instagramData = await this.apify.fetchInfluencerData(username);
          dataSource = "apify";
          console.log(`[Sync:2/7] ✓ Apify provider succeeded on attempt ${retryCount + 1}.`);
        } else {
          throw new Error("Apify not configured");
        }
      } catch (error: any) {
        lastError = error;
        retryCount++;
        console.warn(`[Sync:2/7] Apify attempt ${retryCount} failed: ${error.message}`);
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
        }
      }
    }

    if (!instagramData) {
      errors.push(`Apify failed after ${maxRetries} attempts: ${lastError?.message}`);
      await prisma.influencer.update({
        where: { id: influencerId },
        data: { syncStatus: "FAILED", syncProgress: "Failed to fetch Instagram data" }
      });
      throw new Error("All data providers failed to fetch live Instagram data.");
    }

    console.log(
      `[Sync:2/7] Raw data: ${instagramData.posts.length} posts, ${instagramData.reels.length} reels, followers=${instagramData.profile.followersCount}`
    );

    // ─── Step 3: Upload Profile Image to Cloudinary ─────────────
    console.log(`[Sync:3/7] Uploading profile image to Cloudinary...`);
    await prisma.influencer.update({
      where: { id: influencerId },
      data: { syncProgress: "Uploading media to Cloudinary..." }
    });

    let profileImageUrl = influencer.profileImage;
    if (instagramData.profile.profileImageUrl) {
      try {
        profileImageUrl =
          (await uploadProfileImage(instagramData.profile.profileImageUrl, username)) ??
          profileImageUrl;
        console.log(`[Sync:3/7] ✓ Profile image stored: ${profileImageUrl}`);
      } catch (imgError: any) {
        errors.push(`Profile image upload failed: ${imgError.message}`);
        console.warn(`[Sync:3/7] ✗ Profile image upload failed, keeping existing.`);
      }
    }

    // ─── Step 4: Extract contact info ───────────────────────────
    console.log(`[Sync:4/7] Extracting contact information...`);

    let extractedEmail = instagramData.profile.publicEmail || influencer.email;
    if (!extractedEmail && instagramData.profile.bio) {
      const emailMatch = instagramData.profile.bio.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      );
      if (emailMatch) {
        extractedEmail = emailMatch[0];
        console.log(`[Sync:4/7] ✓ Email extracted from bio: ${extractedEmail}`);
      }
    }

    let extractedPhone = instagramData.profile.publicPhoneNumber || influencer.phoneNumber;
    if (!extractedPhone && instagramData.profile.bio) {
      const phoneMatch = instagramData.profile.bio.match(
        /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/
      );
      if (phoneMatch && phoneMatch[0].replace(/\D/g, "").length >= 7) {
        extractedPhone = phoneMatch[0].trim();
        console.log(`[Sync:4/7] ✓ Phone extracted from bio: ${extractedPhone}`);
      }
    }

    console.log(
      `[Sync:4/7] Contact: email=${extractedEmail || "none"}, phone=${extractedPhone || "none"}`
    );

    // ─── Step 5: Update Profile in DB ───────────────────────────
    console.log(`[Sync:5/7] Updating influencer profile and content in database...`);

    const safeFollowers =
      instagramData.profile.followersCount > 0
        ? instagramData.profile.followersCount
        : influencer.followers;
    const safeFollowing =
      instagramData.profile.followingCount > 0
        ? instagramData.profile.followingCount
        : influencer.following;
    const safePostsCount =
      instagramData.profile.postsCount > 0
        ? instagramData.profile.postsCount
        : influencer.posts;

    await prisma.influencer.update({
      where: { id: influencerId },
      data: {
        influencerName: instagramData.profile.fullName || influencer.influencerName,
        profileDescription: instagramData.profile.bio || influencer.profileDescription,
        profileImage: profileImageUrl,
        followers: safeFollowers,
        following: safeFollowing,
        posts: safePostsCount,
        profileLink: instagramData.profile.externalLink || influencer.profileLink,
        email: extractedEmail,
        phoneNumber: extractedPhone,
        lastSyncDate: new Date(),
      },
    });

    // ─── Process Posts — parallel Cloudinary uploads ─────────────
    const postUploadResults = await Promise.allSettled(
      instagramData.posts.map(async (post: any) => ({
        post,
        thumbnail: post.thumbnailUrl
          ? await uploadPostThumbnail(post.thumbnailUrl, username, post.id)
          : post.thumbnailUrl,
      }))
    );

    let postsSynced = 0;
    for (const result of postUploadResults) {
      if (result.status === "rejected") {
        errors.push(`Post thumbnail upload failed: ${result.reason}`);
        continue;
      }
      const { post, thumbnail } = result.value;
      try {
        await prisma.influencerPost.upsert({
          where: { instagramPostId: post.id },
          create: {
            influencerId,
            instagramPostId: post.id,
            thumbnail: thumbnail || post.thumbnailUrl,
            caption: post.caption,
            likes: post.likesCount,
            comments: post.commentsCount,
            postUrl: post.url,
            publishedDate: post.timestamp || new Date(),
          },
          update: {
            thumbnail: thumbnail || post.thumbnailUrl,
            caption: post.caption,
            likes: post.likesCount,
            comments: post.commentsCount,
          },
        });
        postsSynced++;
      } catch (postError: any) {
        errors.push(`Post ${post.id}: ${postError.message}`);
      }
    }

    // ─── Process Reels — parallel Cloudinary uploads ─────────────
    const reelUploadResults = await Promise.allSettled(
      instagramData.reels.map(async (reel: any) => ({
        reel,
        thumbnail: reel.thumbnailUrl
          ? await uploadReelThumbnail(reel.thumbnailUrl, username, reel.id)
          : reel.thumbnailUrl,
      }))
    );

    let reelsSynced = 0;
    for (const result of reelUploadResults) {
      if (result.status === "rejected") {
        errors.push(`Reel thumbnail upload failed: ${result.reason}`);
        continue;
      }
      const { reel, thumbnail } = result.value;
      try {
        await prisma.influencerReel.upsert({
          where: { instagramReelId: reel.id },
          create: {
            influencerId,
            instagramReelId: reel.id,
            thumbnail: thumbnail || reel.thumbnailUrl,
            reelUrl: reel.url,
            views: reel.viewCount,
            likes: reel.likesCount,
            comments: reel.commentsCount,
            publishedDate: reel.timestamp || new Date(),
          },
          update: {
            thumbnail: thumbnail || reel.thumbnailUrl,
            views: reel.viewCount,
            likes: reel.likesCount,
            comments: reel.commentsCount,
          },
        });
        reelsSynced++;
      } catch (reelError: any) {
        errors.push(`Reel ${reel.id}: ${reelError.message}`);
      }
    }

    console.log(`[Sync:5/7] ✓ Synced ${postsSynced} posts and ${reelsSynced} reels.`);

    // ─── Step 6: Compute & Save Analytics ───────────────────────
    console.log(`[Sync:6/7] Computing content analytics...`);

    const allPosts = instagramData.posts;
    const allReels = instagramData.reels;
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
      topPost = [...allPosts].sort(
        (a: any, b: any) => b.likesCount + b.commentsCount - (a.likesCount + a.commentsCount)
      )[0];
    }

    if (allReels.length > 0) {
      topReel = [...allReels].sort((a: any, b: any) => b.viewCount - a.viewCount)[0];
    }

    const avgEngagementRate =
      updatedFollowers > 0
        ? ((totalEngagements / Math.max(1, allPosts.length)) / updatedFollowers) * 100
        : 0;

    const avgPostLikes =
      allPosts.length > 0 ? Math.floor(totalPostLikes / allPosts.length) : 0;
    const avgPostComments =
      allPosts.length > 0 ? Math.floor(totalPostComments / allPosts.length) : 0;

    const totalReelViews = allReels.reduce((acc: number, r: any) => acc + r.viewCount, 0);
    const avgReelViews =
      allReels.length > 0 ? Math.floor(totalReelViews / allReels.length) : 0;

    const aiInsights = [
      `Consistency: Analyzed ${allPosts.length} recent posts and ${allReels.length} reels.`,
      `Engagement: Average engagement rate is ${avgEngagementRate.toFixed(2)}%.`,
      `Reach: Reels average ${avgReelViews.toLocaleString()} views.`,
      `Content: Average ${avgPostLikes.toLocaleString()} likes and ${avgPostComments.toLocaleString()} comments per post.`,
    ];

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
        aiInsights,
      },
      update: {
        avgEngagementRate,
        avgReelViews,
        avgPostLikes,
        avgPostComments,
        topPostId: topPost?.id,
        topReelId: topReel?.id,
        updatedAt: new Date(),
        aiInsights,
      },
    });

    // Write engagement rate back to Influencer model
    await prisma.influencer.update({
      where: { id: influencerId },
      data: { engagementRate: Math.round(avgEngagementRate * 100) / 100 },
    });

    // Record a point-in-time snapshot so Audience Growth can be charted over successive syncs
    await prisma.influencerMetricSnapshot.create({
      data: {
        influencerId,
        followers: safeFollowers,
        following: safeFollowing,
        posts: safePostsCount,
        engagementRate: Math.round(avgEngagementRate * 100) / 100,
      },
    });

    console.log(
      `[Sync:6/7] ✓ Analytics: engagement=${avgEngagementRate.toFixed(2)}%, avgViews=${avgReelViews}, avgLikes=${avgPostLikes}`
    );

    // ─── Step 7: Generate AI Creator Intelligence ───────────────
    console.log(`[Sync:7/7] Generating AI creator intelligence...`);
    await prisma.influencer.update({
      where: { id: influencerId },
      data: { syncProgress: "Generating AI insights..." }
    });

    let aiInsightsGenerated = false;
    try {
      const { CreatorIntelligenceService } = await import("@/services/ai/creator-intelligence.service");
      const aiService = new CreatorIntelligenceService();
      await aiService.generateInsights(influencerId);
      aiInsightsGenerated = true;
      console.log(`[Sync:7/7] ✓ AI creator intelligence generated.`);
    } catch (aiError: any) {
      errors.push(`AI insights generation failed: ${aiError.message}`);
      console.warn(`[Sync:7/7] ✗ AI insights generation failed: ${aiError.message}`);
    }

    console.log(
      `[Sync] ✓ Complete for @${username} via ${dataSource}. ${errors.length > 0 ? `(${errors.length} non-fatal errors)` : ""}`
    );

    await prisma.influencer.update({
      where: { id: influencerId },
      data: { syncStatus: "COMPLETED", syncProgress: "Profile Ready" }
    });

    await prisma.auditLog.create({
      data: {
        action: "INFLUENCER_SYNC_COMPLETED",
        entityType: "INFLUENCER",
        entityId: influencerId,
        adminId: "SYSTEM",
        details: `Background sync completed for @${username}. Posts: ${postsSynced}, Reels: ${reelsSynced}`,
      },
    });

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
      aiInsightsGenerated,
      errors,
    };
  }
}
