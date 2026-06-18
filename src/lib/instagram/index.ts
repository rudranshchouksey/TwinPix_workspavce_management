/**
 * lib/instagram/index.ts
 *
 * Public API re-exports for the Instagram scraper module.
 */

export { scrapeInstagramProfile, sanitizeUsername } from "./scraper";
export { parseInstagramProfile, parseCount, formatFollowerCount, extractEmailFromBio, extractLinksFromBio } from "./parser";
export { downloadProfileImage } from "./image-downloader";
export type { RawInstagramData, ParsedInstagramProfile, InstagramImportState, InstagramErrorCode } from "./types";
export { InstagramScraperError } from "./types";
