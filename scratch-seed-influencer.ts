import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("@/lib/db");

  const manager = await db.user.findFirst({ where: { role: "ADMIN" } });

  const influencer = await db.influencer.create({
    data: {
      influencerName: "[TEST] Maya Creator",
      instagramHandle: "test_maya_creator_qa",
      platform: "Instagram",
      posts: 22,
      followers: 184_500,
      following: 612,
      category: "Beauty & Lifestyle",
      location: "Mumbai, India",
      email: "test.maya.creator@example.com",
      phoneNumber: "+91 90000 00000",
      profileLink: "https://linktr.ee/test_maya",
      engagementRate: 4.32,
      status: "ACTIVE",
      notes: "[TEST] Great communicator, fast turnaround on deliverables.",
      negotiationTerms: "[TEST] Agreed 50% upfront, 50% on delivery. Exclusivity waived.",
      reelRate: 25000,
      storyRate: 8000,
      assignedManagerId: manager?.id,
      lastSyncDate: new Date(),
    },
  });

  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;

  // 8 weeks of growing metric snapshots
  for (let w = 7; w >= 0; w--) {
    await db.influencerMetricSnapshot.create({
      data: {
        influencerId: influencer.id,
        followers: 160_000 + (7 - w) * 3500,
        following: 650 - (7 - w) * 5,
        engagementRate: 3.6 + (7 - w) * 0.09,
        posts: 14 + (7 - w),
        recordedAt: new Date(now - w * week),
      },
    });
  }

  // Posts spread across last 8 weeks
  const posts = [];
  for (let i = 0; i < 14; i++) {
    const p = await db.influencerPost.create({
      data: {
        influencerId: influencer.id,
        instagramPostId: `test_post_${influencer.id}_${i}`,
        thumbnail: `https://picsum.photos/seed/maya-post-${i}/600/600`,
        caption: `[TEST] Sample caption for post #${i + 1} — collab content.`,
        likes: 3000 + Math.round(Math.random() * 4000),
        comments: 80 + Math.round(Math.random() * 150),
        publishedDate: new Date(now - Math.random() * 8 * week),
        postUrl: "https://instagram.com/p/test123",
      },
    });
    posts.push(p);
  }

  // Reels spread across last 8 weeks
  const reels = [];
  for (let i = 0; i < 10; i++) {
    const r = await db.influencerReel.create({
      data: {
        influencerId: influencer.id,
        instagramReelId: `test_reel_${influencer.id}_${i}`,
        thumbnail: `https://picsum.photos/seed/maya-reel-${i}/400/700`,
        views: 40000 + Math.round(Math.random() * 60000),
        likes: 4000 + Math.round(Math.random() * 5000),
        comments: 150 + Math.round(Math.random() * 200),
        publishedDate: new Date(now - Math.random() * 8 * week),
        reelUrl: "https://instagram.com/reel/test456",
      },
    });
    reels.push(r);
  }

  const topPost = [...posts].sort((a, b) => b.likes - a.likes)[0];
  const topReel = [...reels].sort((a, b) => b.views - a.views)[0];

  await db.influencerContentAnalytics.create({
    data: {
      influencerId: influencer.id,
      avgEngagementRate: 4.32,
      avgReelViews: 68000,
      avgPostLikes: 4800,
      avgPostComments: 145,
      topPostId: topPost.id,
      topReelId: topReel.id,
      contentConsistencyScore: 0.82,
      aiInsights: [
        "[TEST] Consistent posting schedule across feed and reels.",
        "[TEST] Reels significantly outperform static posts in reach.",
      ],
    },
  });

  await db.creatorAIInsights.create({
    data: {
      influencerId: influencer.id,
      summary: "[TEST] Maya is a high-engagement beauty creator with strong brand-safety signals and consistent growth.",
      strengths: ["[TEST] High reel engagement", "[TEST] Reliable communicator", "[TEST] Strong audience trust"],
      weaknesses: ["[TEST] Limited video diversity", "[TEST] Posting cadence dips on weekends"],
      recommendedCategories: ["Beauty", "Skincare", "Lifestyle", "Wellness"],
      brandSafetyScore: "LOW",
      brandSafetyReason: "[TEST] No controversial content found in recent history.",
      collaborationRecommendation: "STRONGLY_RECOMMEND",
      intelligenceScore: 87,
      modelUsed: "test-seed",
    },
  });

  let client = await db.client.findFirst({ where: { companyName: "[TEST] Glow Cosmetics" } });
  if (!client) {
    client = await db.client.create({
      data: {
        companyName: "[TEST] Glow Cosmetics",
        brandName: "Glow",
        contactPerson: "[TEST] Contact Person",
        email: "test.glow.client@example.com",
        status: "ACTIVE",
      },
    });
  }

  const campaign = await db.campaign.create({
    data: {
      name: "[TEST] Glow Summer Launch",
      clientId: client.id,
      budget: 150000,
      deliverables: "2 Reels, 3 Feed Posts",
      startDate: new Date(now - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now + 14 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });

  await db.campaignInfluencer.create({
    data: {
      campaignId: campaign.id,
      influencerId: influencer.id,
      fee: 33000,
      deliverables: "2 Reels, 3 Feed Posts",
      status: "IN_PROGRESS",
    },
  });

  // Activity log entries
  const actions = [
    "Status changed to ACTIVE",
    "Added to campaign [TEST] Glow Summer Launch",
    "Negotiation terms updated",
    "Instagram data synced",
    "Rate card updated",
  ];
  for (let i = 0; i < actions.length; i++) {
    await db.auditLog.create({
      data: {
        action: "INFLUENCER_UPDATED",
        entityType: "INFLUENCER",
        entityId: influencer.id,
        details: `[TEST] ${actions[i]}`,
        createdAt: new Date(now - i * 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(JSON.stringify({ influencerId: influencer.id, campaignId: campaign.id, clientId: client.id }));
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
