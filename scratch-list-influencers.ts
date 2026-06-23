import "dotenv/config";
import { db } from "./src/lib/db";

async function main() {
  const prisma = db as any;
  const list = await prisma.influencer.findMany({
    select: { id: true, instagramHandle: true, followers: true, lastSyncDate: true, createdAt: true },
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  console.log(JSON.stringify(list, null, 2));
}

main().catch((e) => console.error("ERR:", e)).finally(() => process.exit(0));
