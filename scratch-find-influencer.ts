import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { db: prisma } = await import("@/lib/db");
  const influencers = await prisma.influencer.findMany({
    include: {
      _count: { select: { recentPosts: true, recentReels: true, campaigns: true } },
      creatorIntelligence: true,
    },
    take: 500,
  });
  const sorted = influencers
    .map(i => ({ id: i.id, name: i.influencerName, handle: i.instagramHandle, posts: i._count.recentPosts, reels: i._count.recentReels, campaigns: i._count.campaigns, hasAI: !!i.creatorIntelligence }))
    .sort((a, b) => (b.posts + b.reels + b.campaigns) - (a.posts + a.reels + a.campaigns));
  console.log(JSON.stringify(sorted.slice(0, 5), null, 2));
  await prisma.$disconnect();
}
main();
