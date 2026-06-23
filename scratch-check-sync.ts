import "dotenv/config";
import { db } from "./src/lib/db";

async function main() {
  const prisma = db as any;
  const total = await prisma.influencer.count();
  const synced = await prisma.influencer.count({ where: { lastSyncDate: { not: null } } });
  const unsynced = await prisma.influencer.findMany({
    where: { lastSyncDate: null },
    select: { id: true, instagramHandle: true, createdAt: true, followers: true },
  });
  console.log("total:", total, "synced:", synced, "unsynced:", total - synced);
  console.log("UNSYNCED LIST:", JSON.stringify(unsynced, null, 2));
}

main().catch((e) => console.error("ERR:", e)).finally(() => process.exit(0));
