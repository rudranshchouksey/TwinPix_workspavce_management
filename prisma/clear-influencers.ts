import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🗑️ Deleting existing test influencers...");
  // We use queryRaw because the Prisma schema might be slightly out of sync if we try to use prisma.influencer.deleteMany()
  await prisma.$executeRawUnsafe(`DELETE FROM "influencers";`);
  console.log("✅ Cleared influencers table.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
