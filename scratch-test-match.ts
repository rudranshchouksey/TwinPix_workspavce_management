import "dotenv/config";
import { BrandMatchService } from "./src/services/ai/brand-match.service";
import { db } from "./src/lib/db";

async function main() {
  const prisma = db as any;

  let campaign = await prisma.campaign.findFirst({
    select: { id: true, name: true, client: { select: { companyName: true } } },
  });
  const influencer = await prisma.influencer.findFirst({
    where: { instagramHandle: "gypsymilady" },
    select: { id: true, instagramHandle: true },
  });

  let createdTestClient = false;
  let testClientId: string | null = null;

  if (!campaign) {
    console.log("No campaigns exist yet — creating a temporary test client + campaign...");
    const client = await prisma.client.create({
      data: {
        companyName: "Nykaa (TEST - delete me)",
        contactPerson: "Test Contact",
        email: `test-nykaa-${Date.now()}@example.invalid`,
        industry: "Beauty & Cosmetics",
        status: "ACTIVE",
      },
    });
    testClientId = client.id;
    createdTestClient = true;

    campaign = await prisma.campaign.create({
      data: {
        name: "Festive Glow Campaign (TEST - delete me)",
        clientId: client.id,
        budget: 50000,
        deliverables: "2 Instagram Reels showcasing new festive makeup collection, 3 Stories with swipe-up link, 1 Carousel post with before/after look.",
        status: "PLANNING",
      },
      select: { id: true, name: true, client: { select: { companyName: true } } },
    });
  }

  if (!influencer) {
    console.error("Missing test influencer 'gypsymilady'");
    return;
  }

  console.log("Campaign:", campaign.name, "/ Client:", campaign.client?.companyName);
  console.log("Influencer:", influencer.instagramHandle);

  const service = new BrandMatchService();

  console.log("\n--- First call (should compute via OpenAI) ---");
  const t0 = Date.now();
  const first = await service.getOrCreateMatch(campaign.id, influencer.id);
  console.log(`Took ${Date.now() - t0}ms`);
  console.log(JSON.stringify(first, null, 2));

  console.log("\n--- Second call (should hit cache, near-instant) ---");
  const t1 = Date.now();
  const second = await service.getOrCreateMatch(campaign.id, influencer.id);
  console.log(`Took ${Date.now() - t1}ms`);
  console.log("Same record ID (no recompute):", first.id === second.id);

  if (createdTestClient) {
    console.log("\nCleaning up temporary test client/campaign...");
    await prisma.client.delete({ where: { id: testClientId } });
    console.log("Cleaned up.");
  }
}

main()
  .catch((e) => console.error("FAILED:", e))
  .finally(() => process.exit(0));
