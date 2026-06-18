/**
 * lib/instagram/parser.ts
 *
 * Parser utilities for normalizing raw Instagram scraped data
 * into a clean, consistent ParsedInstagramProfile.
 * Handles multiple data source formats (JSON-LD, meta tags, GraphQL).
 */

import { RawInstagramData, ParsedInstagramProfile, InstagramScraperError } from "./types";

interface InstagramGraphqlUser {
  biography?: string;
  bio?: string;
  business_email?: string;
  username?: string;
  full_name?: string;
  fullName?: string;
  edge_followed_by?: { count: number };
  follower_count?: number;
  followers_count?: number;
  edge_follow?: { count: number };
  following_count?: number;
  edge_owner_to_timeline_media?: { count: number };
  media_count?: number;
  profile_pic_url_hd?: string;
  profile_pic_url?: string;
  external_url?: string;
  bio_link?: { url: string };
  is_verified?: boolean;
  is_private?: boolean;
}

interface InstagramJsonLd {
  description?: string;
  alternateName?: string;
  name?: string;
  interactionStatistic?: Array<{
    interactionType: string;
    userInteractionCount: number;
  }>;
  image?: string;
  url?: string;
}

// ─── Number Parsing ──────────────────────────────────────────

/**
 * Parse a follower/following/post count string into a number.
 * Handles formats like "1.5M", "10.2K", "1,234", "1234", etc.
 */
export function parseCount(value: unknown): number {
  if (typeof value === "number") return Math.max(0, Math.floor(value));
  if (!value) return 0;

  const str = String(value).trim().replace(/,/g, "");

  // Handle compact notation (1.5M, 10K, etc.)
  const compactMatch = str.match(/^([\d.]+)\s*([KkMmBb])?$/);
  if (compactMatch) {
    const num = parseFloat(compactMatch[1]);
    const multiplier = compactMatch[2]?.toUpperCase();
    if (multiplier === "K") return Math.floor(num * 1_000);
    if (multiplier === "M") return Math.floor(num * 1_000_000);
    if (multiplier === "B") return Math.floor(num * 1_000_000_000);
    return Math.floor(num);
  }

  // Try direct parse
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Format a number into a compact display string.
 * e.g., 1500 → "1.5K", 2300000 → "2.3M"
 */
export function formatFollowerCount(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// ─── Bio Extraction ──────────────────────────────────────────

/**
 * Extract email addresses from a bio string.
 * Returns the first email found, or null.
 */
export function extractEmailFromBio(bio: string | null | undefined): string | null {
  if (!bio) return null;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = bio.match(emailRegex);
  return matches?.[0] || null;
}

/**
 * Extract URLs from a bio string.
 */
export function extractLinksFromBio(bio: string | null | undefined): string[] {
  if (!bio) return [];
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  return bio.match(urlRegex) || [];
}

// ─── Meta Tag Parsing ────────────────────────────────────────

/**
 * Extract follower/following/post counts from the og:description meta tag.
 * Instagram typically formats this as:
 * "1.5M Followers, 500 Following, 2,345 Posts - See Instagram photos and videos from Name (@username)"
 */
function parseMetaDescription(description: string | undefined): {
  followers: number;
  following: number;
  posts: number;
} {
  const result = { followers: 0, following: 0, posts: 0 };
  if (!description) return result;

  const followersMatch = description.match(
    /([\d,.]+[KkMmBb]?)\s*Followers/i
  );
  const followingMatch = description.match(
    /([\d,.]+[KkMmBb]?)\s*Following/i
  );
  const postsMatch = description.match(/([\d,.]+[KkMmBb]?)\s*Posts/i);

  if (followersMatch) result.followers = parseCount(followersMatch[1]);
  if (followingMatch) result.following = parseCount(followingMatch[1]);
  if (postsMatch) result.posts = parseCount(postsMatch[1]);

  return result;
}

/**
 * Extract the full name from the og:title meta tag.
 * Format: "Full Name (@username) • Instagram photos and videos"
 */
function parseMetaTitle(title: string | undefined): string | null {
  if (!title) return null;

  // "Name (@username) • Instagram photos and videos"
  const match = title.match(/^(.+?)\s*\(@/);
  if (match) return match[1].trim();

  // "Name • Instagram"
  const match2 = title.match(/^(.+?)\s*[•·|]/);
  if (match2) return match2[1].trim();

  return null;
}

// ─── Main Parser ─────────────────────────────────────────────

/**
 * Parse raw scraped Instagram data into a clean, normalized profile.
 * Handles data from multiple source strategies.
 */
export function parseInstagramProfile(raw: RawInstagramData): ParsedInstagramProfile {
  const { username, jsonLd, metaTags, graphqlUser } = raw;

  // ── GraphQL user data (most complete) ──
  if (graphqlUser) {
    const user = graphqlUser as InstagramGraphqlUser;
    const bio = user.biography || user.bio || null;
    const email = extractEmailFromBio(bio) || user.business_email || null;

    return {
      username: user.username || username,
      fullName: user.full_name || user.fullName || username,
      bio,
      followers: parseCount(
        user.edge_followed_by?.count ??
        user.follower_count ??
        user.followers_count ??
        0
      ),
      following: parseCount(
        user.edge_follow?.count ??
        user.following_count ??
        0
      ),
      posts: parseCount(
        user.edge_owner_to_timeline_media?.count ??
        user.media_count ??
        0
      ),
      profileImageUrl:
        user.profile_pic_url_hd ||
        user.profile_pic_url ||
        null,
      externalUrl: user.external_url || user.bio_link?.url || null,
      email,
      isVerified: user.is_verified ?? false,
      isPrivate: user.is_private ?? false,
      instagramUrl: `https://www.instagram.com/${user.username || username}/`,
    };
  }

  // ── JSON-LD data ──
  if (jsonLd) {
    const ld = jsonLd as InstagramJsonLd;
    const description = metaTags?.["og:description"] || ld.description || "";
    const stats = parseMetaDescription(description);
    const bio = ld.description || metaTags?.["description"] || null;
    const email = extractEmailFromBio(bio);

    return {
      username: ld.alternateName?.replace("@", "") || username,
      fullName: ld.name || parseMetaTitle(metaTags?.["og:title"]) || username,
      bio: bio || null,
      followers: parseCount(
        ld.interactionStatistic?.find?.(
          (s: { interactionType: string }) => s.interactionType === "http://schema.org/FollowAction"
        )?.userInteractionCount ?? stats.followers
      ),
      following: stats.following,
      posts: stats.posts,
      profileImageUrl: ld.image || metaTags?.["og:image"] || null,
      externalUrl: ld.url !== `https://www.instagram.com/${username}/` ? (ld.url || null) : null,
      email,
      isVerified: false,
      isPrivate: false,
      instagramUrl: `https://www.instagram.com/${username}/`,
    };
  }

  // ── Meta tags only (least data) ──
  if (metaTags && Object.keys(metaTags).length > 0) {
    const description = metaTags["og:description"] || metaTags["description"] || "";
    const stats = parseMetaDescription(description);
    const fullName = parseMetaTitle(metaTags["og:title"]);
    const email = extractEmailFromBio(description);

    // Extract bio — it's usually the part after the stats in og:description
    let bio: string | null = null;
    const bioMatch = description.match(
      /Posts\s*[-–—]\s*(?:See Instagram photos and videos from\s+)?(.+)/i
    );
    if (bioMatch) bio = bioMatch[1].trim();

    return {
      username,
      fullName: fullName || username,
      bio,
      followers: stats.followers,
      following: stats.following,
      posts: stats.posts,
      profileImageUrl: metaTags["og:image"] || null,
      externalUrl: null,
      email,
      isVerified: false,
      isPrivate: false,
      instagramUrl: `https://www.instagram.com/${username}/`,
    };
  }

  throw new InstagramScraperError(
    "No parseable data found in the scraped response.",
    "PARSE_ERROR"
  );
}
