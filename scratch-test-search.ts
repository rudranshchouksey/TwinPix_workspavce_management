import "dotenv/config";
import { SmartSearchService } from "./src/services/ai/smart-search.service";
import { db } from "./src/lib/db";

const QUERIES = [
  "Fashion influencers from Mumbai",
  "Creators with engagement rate above 5%",
  "Influencers not contacted in last 30 days",
  "Active campaigns with budget over 1000",
  "Clients in the beauty industry",
  "Overdue tasks",
];

async function main() {
  const service = new SmartSearchService();

  for (const q of QUERIES) {
    console.log(`\n=== "${q}" ===`);
    const t0 = Date.now();
    try {
      const res = await service.search(q);
      console.log(`Took ${Date.now() - t0}ms | entity=${res.entity} | fromCache=${res.fromCache} | results=${res.results.length}`);
      console.log("Explanation:", res.explanation);
      console.log("Suggested filters:", res.suggestedFilters);
      console.log("Sample result:", JSON.stringify(res.results[0], null, 2));
    } catch (e: any) {
      console.error("FAILED:", e.message);
    }
  }

  console.log("\n=== Re-running first query to test cache hit ===");
  const t1 = Date.now();
  const cached = await service.search(QUERIES[0]);
  console.log(`Took ${Date.now() - t1}ms | fromCache=${cached.fromCache}`);

  const prisma = db as any;
  const cacheRows = await prisma.searchQueryCache.findMany({
    select: { normalizedQuery: true, hitCount: true, entity: true },
  });
  console.log("\nCache table contents:", JSON.stringify(cacheRows, null, 2));
}

main()
  .catch((e) => console.error("FAILED:", e))
  .finally(() => process.exit(0));
