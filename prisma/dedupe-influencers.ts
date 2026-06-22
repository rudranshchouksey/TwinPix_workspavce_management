import { PrismaClient, Influencer } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase().replace(/^@/, "");
}

// Higher score = more complete record. Used to pick which duplicate to keep.
function completeness(inf: Influencer): number {
  const fields = [
    inf.influencerName,
    inf.platform,
    inf.posts,
    inf.followers,
    inf.following,
    inf.category,
    inf.location,
    inf.email,
    inf.phoneNumber,
    inf.profileLink,
    inf.sampleVideoViews,
    inf.profileDescription,
    inf.engagementRate,
    inf.notes,
    inf.profileImage,
    inf.assignedManagerId,
    inf.reelRate,
    inf.storyRate,
  ];
  return fields.filter((v) => v !== null && v !== undefined && v !== "").length;
}

function pickKeeper(group: Influencer[]): { keeper: Influencer; losers: Influencer[] } {
  const sorted = [...group].sort((a, b) => {
    const c = completeness(b) - completeness(a);
    if (c !== 0) return c;
    return a.createdAt.getTime() - b.createdAt.getTime(); // older record wins ties
  });
  return { keeper: sorted[0], losers: sorted.slice(1) };
}

async function mergeLoserIntoKeeper(keeper: Influencer, loser: Influencer) {
  // Fill any gaps on the keeper with data from the loser before deleting it.
  const fillData: Record<string, unknown> = {};
  const fillableFields: (keyof Influencer)[] = [
    "influencerName",
    "platform",
    "posts",
    "followers",
    "following",
    "category",
    "location",
    "email",
    "phoneNumber",
    "profileLink",
    "sampleVideoViews",
    "profileDescription",
    "engagementRate",
    "notes",
    "profileImage",
    "assignedManagerId",
    "reelRate",
    "storyRate",
    "lastContactDate",
    "lastSyncDate",
  ];
  for (const field of fillableFields) {
    if ((keeper as any)[field] === null || (keeper as any)[field] === undefined) {
      if ((loser as any)[field] !== null && (loser as any)[field] !== undefined) {
        fillData[field] = (loser as any)[field];
      }
    }
  }
  fillData.campaignCount = keeper.campaignCount + loser.campaignCount;

  if (Object.keys(fillData).length > 0) {
    await prisma.influencer.update({ where: { id: keeper.id }, data: fillData });
  }

  // Re-point campaign assignments, skipping any the keeper is already part of.
  const loserCampaigns = await prisma.campaignInfluencer.findMany({ where: { influencerId: loser.id } });
  for (const ci of loserCampaigns) {
    const exists = await prisma.campaignInfluencer.findUnique({
      where: { campaignId_influencerId: { campaignId: ci.campaignId, influencerId: keeper.id } },
    });
    if (exists) {
      await prisma.campaignInfluencer.delete({ where: { id: ci.id } });
    } else {
      await prisma.campaignInfluencer.update({ where: { id: ci.id }, data: { influencerId: keeper.id } });
    }
  }

  // Files, events, posts and reels have no per-influencer uniqueness constraint, so just re-point them.
  await prisma.file.updateMany({ where: { influencerId: loser.id }, data: { influencerId: keeper.id } });
  await prisma.event.updateMany({ where: { influencerId: loser.id }, data: { influencerId: keeper.id } });
  await prisma.influencerPost.updateMany({ where: { influencerId: loser.id }, data: { influencerId: keeper.id } });
  await prisma.influencerReel.updateMany({ where: { influencerId: loser.id }, data: { influencerId: keeper.id } });

  // Analytics is 1:1 per influencer; keep the keeper's row if it has one, otherwise adopt the loser's.
  const keeperAnalytics = await prisma.influencerContentAnalytics.findUnique({ where: { influencerId: keeper.id } });
  const loserAnalytics = await prisma.influencerContentAnalytics.findUnique({ where: { influencerId: loser.id } });
  if (loserAnalytics) {
    if (keeperAnalytics) {
      await prisma.influencerContentAnalytics.delete({ where: { id: loserAnalytics.id } });
    } else {
      await prisma.influencerContentAnalytics.update({
        where: { id: loserAnalytics.id },
        data: { influencerId: keeper.id },
      });
    }
  }

  await prisma.influencer.delete({ where: { id: loser.id } });
}

async function main() {
  const all = await prisma.influencer.findMany({ orderBy: { createdAt: "asc" } });
  console.log(`Loaded ${all.length} influencer records.`);

  const groups = new Map<string, Influencer[]>();
  for (const inf of all) {
    const key = normalizeHandle(inf.instagramHandle);
    const list = groups.get(key) ?? [];
    list.push(inf);
    groups.set(key, list);
  }

  const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);

  if (duplicateGroups.length === 0) {
    console.log("✅ No duplicate influencer entries found (by normalized Instagram handle).");
    return;
  }

  console.log(`⚠️  Found ${duplicateGroups.length} duplicate handle group(s):\n`);

  let totalLosers = 0;
  for (const group of duplicateGroups) {
    const { keeper, losers } = pickKeeper(group);
    totalLosers += losers.length;
    console.log(`@${keeper.instagramHandle}`);
    console.log(`  KEEP   ${keeper.id}  name="${keeper.influencerName ?? ""}"  createdAt=${keeper.createdAt.toISOString()}`);
    for (const l of losers) {
      console.log(`  REMOVE ${l.id}  name="${l.influencerName ?? ""}"  createdAt=${l.createdAt.toISOString()}  handle="${l.instagramHandle}"`);
    }
    console.log("");
  }

  if (!APPLY) {
    console.log(`Dry run only — ${totalLosers} duplicate record(s) would be merged/removed.`);
    console.log(`Re-run with --apply to actually merge and delete them.`);
    return;
  }

  console.log(`Applying merge for ${totalLosers} duplicate record(s)...\n`);
  for (const group of duplicateGroups) {
    const { keeper, losers } = pickKeeper(group);
    for (const loser of losers) {
      await mergeLoserIntoKeeper(keeper, loser);
      console.log(`Merged and removed ${loser.id} -> kept ${keeper.id} (@${keeper.instagramHandle})`);
    }
  }

  console.log(`\n✅ Done. Removed ${totalLosers} duplicate influencer record(s).`);
}

main()
  .catch((e) => {
    console.error("Dedupe failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
