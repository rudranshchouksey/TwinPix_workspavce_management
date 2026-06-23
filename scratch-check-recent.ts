import "dotenv/config";
import { db } from "./src/lib/db";

async function main() {
  const prisma = db as any;
  const recent = await prisma.influencer.findMany({
    where: { createdAt: { gte: new Date("2026-06-20T00:00:00Z") } },
    select: { id: true, instagramHandle: true, createdAt: true, lastSyncDate: true, followers: true, profileImage: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(JSON.stringify(recent, null, 2));
}
main().catch((e) => console.error("ERR:", e)).finally(() => process.exit(0));
