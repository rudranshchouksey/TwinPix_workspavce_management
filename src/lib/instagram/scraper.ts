/**
 * lib/instagram/scraper.ts
 *
 * Instagram profile scraper using public HTML endpoints.
 * Tries multiple strategies in order of reliability:
 *   1. Fetch public profile page → parse embedded JSON-LD + meta tags
 *   2. Fallback to Instagram's web profile info API endpoint
 *
 * Includes retry logic with exponential backoff.
 */

import {
  RawInstagramData,
  InstagramScraperError,
} from "./types";

// ─── Constants ───────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/** Browser-like headers to avoid bot detection */
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

// ─── Username Validation ─────────────────────────────────────

/**
 * Sanitize and validate an Instagram username.
 * Strips leading @ and trailing slashes.
 */
export function sanitizeUsername(input: string): string {
  let username = input.trim();

  // Handle full URLs
  const urlMatch = username.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/
  );
  if (urlMatch) {
    username = urlMatch[1];
  }

  // Strip leading @ and trailing slashes
  username = username.replace(/^@/, "").replace(/\/+$/, "");

  // Validate format
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
    throw new InstagramScraperError(
      `Invalid Instagram username: "${username}". Usernames can only contain letters, numbers, periods, and underscores.`,
      "NOT_FOUND",
      400
    );
  }

  return username.toLowerCase();
}

// ─── Retry Helper ────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on definitive errors
      if (error instanceof InstagramScraperError) {
        if (
          error.code === "NOT_FOUND" ||
          error.code === "PRIVATE_ACCOUNT"
        ) {
          throw error;
        }
      }

      // Exponential backoff
      if (attempt < retries - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new InstagramScraperError("Max retries exceeded", "NETWORK_ERROR");
}

// ─── Strategy 1: HTML Profile Page ──────────────────────────

async function scrapeFromHtml(username: string): Promise<RawInstagramData> {
  const url = `https://www.instagram.com/${username}/`;

  const response = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
  });

  if (response.status === 404) {
    throw new InstagramScraperError(
      `Profile "${username}" not found on Instagram.`,
      "NOT_FOUND",
      404
    );
  }

  if (response.status === 429) {
    throw new InstagramScraperError(
      "Rate limited by Instagram.",
      "RATE_LIMITED",
      429
    );
  }

  if (!response.ok) {
    throw new InstagramScraperError(
      `Instagram returned status ${response.status}`,
      response.status === 403 ? "BLOCKED" : "NETWORK_ERROR",
      response.status
    );
  }

  const html = await response.text();

  // Check if we got a login wall (Instagram redirects non-logged-in users sometimes)
  if (
    html.includes("loginForm") &&
    !html.includes('"@type"') &&
    !html.includes("og:title")
  ) {
    throw new InstagramScraperError(
      "Instagram requires login to view this profile.",
      "BLOCKED",
      403
    );
  }

  // Extract JSON-LD
  let jsonLd: Record<string, unknown> | undefined;
  const jsonLdMatch = html.match(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/
  );
  if (jsonLdMatch) {
    try {
      jsonLd = JSON.parse(jsonLdMatch[1]);
    } catch {
      // JSON-LD parsing failed, continue with meta tags
    }
  }

  // Extract meta tags
  const metaTags: Record<string, string> = {};
  const metaRegex =
    /<meta\s+(?:property|name)=["']([^"']+)["']\s+content=["']([^"']*)["']/g;
  let metaMatch;
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    metaTags[metaMatch[1]] = metaMatch[2];
  }

  // Also try the reverse order (content before property)
  const metaRegex2 =
    /<meta\s+content=["']([^"']*)["']\s+(?:property|name)=["']([^"']+)["']/g;
  while ((metaMatch = metaRegex2.exec(html)) !== null) {
    metaTags[metaMatch[2]] = metaMatch[1];
  }

  // Try to extract _sharedData or additional config JSON
  const sharedDataMatch = html.match(
    /window\._sharedData\s*=\s*({[\s\S]*?});<\/script>/
  );
  let graphqlUser: Record<string, unknown> | undefined;
  if (sharedDataMatch) {
    try {
      const sharedData = JSON.parse(sharedDataMatch[1]);
      graphqlUser =
        sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
    } catch {
      // Shared data parsing failed
    }
  }

  // Also try __additionalDataLoaded or require patterns
  const additionalDataMatch = html.match(
    /"user":\s*({[^}]*"username":\s*"[^"]*"[^}]*(?:{[^}]*}[^}]*)*})/
  );
  if (!graphqlUser && additionalDataMatch) {
    try {
      graphqlUser = JSON.parse(additionalDataMatch[1]);
    } catch {
      // Additional data parsing failed
    }
  }

  if (!jsonLd && Object.keys(metaTags).length === 0 && !graphqlUser) {
    throw new InstagramScraperError(
      "Could not extract any data from the Instagram profile page.",
      "PARSE_ERROR"
    );
  }

  return {
    username,
    jsonLd,
    metaTags,
    graphqlUser,
    source: jsonLd ? "html_jsonld" : graphqlUser ? "graphql_api" : "html_meta",
  };
}

// ─── Strategy 2: Web Profile Info API ────────────────────────

async function scrapeFromApi(username: string): Promise<RawInstagramData> {
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

  const response = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      "X-IG-App-ID": "936619743392459",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (response.status === 404) {
    throw new InstagramScraperError(
      `Profile "${username}" not found.`,
      "NOT_FOUND",
      404
    );
  }

  if (response.status === 429) {
    throw new InstagramScraperError(
      "Rate limited by Instagram API.",
      "RATE_LIMITED",
      429
    );
  }

  if (!response.ok) {
    throw new InstagramScraperError(
      `Instagram API returned status ${response.status}`,
      response.status === 403 ? "BLOCKED" : "NETWORK_ERROR",
      response.status
    );
  }

  const json = await response.json();
  const user = json?.data?.user;

  if (!user) {
    throw new InstagramScraperError(
      "No user data in API response.",
      "PARSE_ERROR"
    );
  }

  return {
    username,
    graphqlUser: user,
    source: "graphql_api",
  };
}

// ─── Main Scraper Function ───────────────────────────────────

/**
 * Scrape an Instagram profile using multiple strategies.
 * Tries HTML parsing first, then falls back to the API endpoint.
 * Includes retry logic with exponential backoff.
 */
export async function scrapeInstagramProfile(
  rawUsername: string
): Promise<RawInstagramData> {
  const username = sanitizeUsername(rawUsername);

  // Try Strategy 1: HTML scraping with retries
  try {
    return await withRetry(() => scrapeFromHtml(username));
  } catch (htmlError) {
    // If it's a definitive "not found", don't try the API fallback
    if (
      htmlError instanceof InstagramScraperError &&
      htmlError.code === "NOT_FOUND"
    ) {
      throw htmlError;
    }

    // Try Strategy 2: API endpoint with retries
    try {
      return await withRetry(() => scrapeFromApi(username));
    } catch (apiError) {
      // If the API also failed, throw the most informative error
      if (apiError instanceof InstagramScraperError) {
        throw apiError;
      }

      // Fall back to the HTML error if both failed
      throw htmlError instanceof InstagramScraperError
        ? htmlError
        : new InstagramScraperError(
            "Failed to scrape Instagram profile after all attempts.",
            "NETWORK_ERROR"
          );
    }
  }
}
