/**
 * Bulk Instagram sync for all influencers via Apify.
 *
 * Each sync calls a paid Apify actor, so this is intentionally:
 *   - sequential (one at a time, never concurrent)
 *   - paced with a delay between calls
 *   - skips influencers synced recently (avoids paying to re-scrape fresh data)
 *   - capped by --limit unless --all is passed, so you can test small before going wide
 *
 * Usage:
 *   npx tsx prisma/bulk-sync-influencers.ts                 # sync up to 10 (default limit), skip if synced <7d ago
 *   npx tsx prisma/bulk-sync-influencers.ts --limit=25       # sync up to 25
 *   npx tsx prisma/bulk-sync-influencers.ts --all            # sync every eligible influencer
 *   npx tsx prisma/bulk-sync-influencers.ts --all --force    # ignore the 7-day skip, resync everyone
 *   npx tsx prisma/bulk-sync-influencers.ts --dry-run        # just list who would be synced, no Apify calls
 *   npx tsx prisma/bulk-sync-influencers.ts --delay=8000      # override the delay between syncs (ms)
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { InstagramSyncService } from "../src/services/instagram/instagram-sync.service";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string, fallback: number) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? Number(arg.split("=")[1]) : fallback;
};

const ALL = flag("all");
const FORCE = flag("force");
const DRY_RUN = flag("dry-run");
const LIMIT = ALL ? Infinity : value("limit", 10);
const DELAY_MS = value("delay", 5000);
const SKIP_IF_SYNCED_WITHIN_DAYS = 7;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!DRY_RUN && !process.env.APIFY_API_TOKEN) {
    console.error("APIFY_API_TOKEN is not set. Aborting before spending any Apify credits.");
    process.exit(1);
  }

  const cutoff = new Date(Date.now() - SKIP_IF_SYNCED_WITHIN_DAYS * 24 * 60 * 60 * 1000);

  const allInfluencers = await db.influencer.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, instagramHandle: true, lastSyncDate: true },
  });

  const eligible = allInfluencers.filter((inf) => {
    if (FORCE) return true;
    return !inf.lastSyncDate || inf.lastSyncDate < cutoff;
  });

  const skippedRecent = allInfluencers.length - eligible.length;
  const queue = eligible.slice(0, LIMIT);

  console.log(`Total influencers: ${allInfluencers.length}`);
  console.log(`Already synced within ${SKIP_IF_SYNCED_WITHIN_DAYS}d (skipped): ${skippedRecent}`);
  console.log(`Eligible for sync: ${eligible.length}`);
  console.log(`This run will process: ${queue.length}${ALL ? " (--all)" : ` (--limit=${LIMIT})`}`);
  console.log(`Pacing: sequential, ${DELAY_MS}ms delay between each\n`);

  if (DRY_RUN) {
    console.log("[dry run] Would sync:");
    for (const inf of queue) console.log(`  @${inf.instagramHandle} (${inf.id})`);
    return;
  }

  if (queue.length === 0) {
    console.log("Nothing to sync.");
    return;
  }

  const syncService = new InstagramSyncService();
  const startedAt = Date.now();

  let succeeded = 0;
  const failed: { handle: string; id: string; error: string }[] = [];

  for (let i = 0; i < queue.length; i++) {
    const inf = queue[i];
    const label = `[${i + 1}/${queue.length}] @${inf.instagramHandle}`;
    const itemStart = Date.now();

    try {
      console.log(`\n${label} — syncing...`);
      const result = await syncService.syncInfluencer(inf.id);
      succeeded++;
      console.log(
        `${label} ✓ done in ${((Date.now() - itemStart) / 1000).toFixed(1)}s — ` +
          `followers=${result.profile.followers}, posts=${result.contentSynced.posts}, reels=${result.contentSynced.reels}` +
          (result.errors.length ? ` (${result.errors.length} non-fatal warnings)` : "")
      );
    } catch (err: any) {
      failed.push({ handle: inf.instagramHandle, id: inf.id, error: err.message || String(err) });
      console.error(`${label} ✗ FAILED: ${err.message || err}`);
    }

    const isLast = i === queue.length - 1;
    if (!isLast) {
      await sleep(DELAY_MS);
    }
  }

  const totalMinutes = ((Date.now() - startedAt) / 60000).toFixed(1);

  console.log(`\n──────────────────────────────`);
  console.log(`Done in ${totalMinutes} min. Succeeded: ${succeeded}/${queue.length}. Failed: ${failed.length}.`);
  if (failed.length > 0) {
    console.log(`\nFailed influencers:`);
    for (const f of failed) console.log(`  @${f.handle} (${f.id}): ${f.error}`);
  }
  if (!ALL && eligible.length > queue.length) {
    console.log(`\n${eligible.length - queue.length} more eligible influencers were not processed (--limit=${LIMIT}). Re-run with --all to continue.`);
  }
}

main()
  .catch((e) => {
    console.error("Bulk sync failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
