// This barrel re-exports were previously used for the Playwright-based scraping.
// After migrating to Apify, the browser-based scraping is no longer used.
// Keeping this file for backward compatibility but removing all Playwright imports.

export type { SyncResult } from "./instagram-sync.service";
export { InstagramSyncService } from "./instagram-sync.service";
