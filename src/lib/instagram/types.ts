/**
 * lib/instagram/types.ts
 *
 * Type definitions for the Instagram scraper system.
 * Covers raw scraped data, parsed profiles, error types,
 * and UI state management.
 */

// ─── Raw Scraped Data ────────────────────────────────────────

/** Raw data extracted from Instagram HTML / JSON endpoints */
export interface RawInstagramData {
  /** The username we scraped */
  username: string;
  /** Raw JSON-LD data from the page, if found */
  jsonLd?: Record<string, unknown>;
  /** Raw meta tags extracted from the page */
  metaTags?: Record<string, string>;
  /** Raw GraphQL user data, if the API endpoint worked */
  graphqlUser?: Record<string, unknown>;
  /** The source strategy that succeeded */
  source: "html_jsonld" | "graphql_api" | "html_meta";
}

// ─── Parsed Profile ──────────────────────────────────────────

/** Cleaned, normalized Instagram profile data ready for import */
export interface ParsedInstagramProfile {
  username: string;
  fullName: string;
  bio: string | null;
  followers: number;
  following: number;
  posts: number;
  profileImageUrl: string | null;
  externalUrl: string | null;
  email: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  instagramUrl: string;
}

// ─── Error Types ─────────────────────────────────────────────

export type InstagramErrorCode =
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "PRIVATE_ACCOUNT"
  | "PARSE_ERROR"
  | "NETWORK_ERROR"
  | "BLOCKED"
  | "UNKNOWN";

export class InstagramScraperError extends Error {
  public readonly code: InstagramErrorCode;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: InstagramErrorCode,
    statusCode: number = 500
  ) {
    super(message);
    this.name = "InstagramScraperError";
    this.code = code;
    this.statusCode = statusCode;
  }

  /** Human-friendly error messages for each code */
  static getDisplayMessage(code: InstagramErrorCode): string {
    const messages: Record<InstagramErrorCode, string> = {
      RATE_LIMITED:
        "Instagram is rate-limiting requests. Please wait a few minutes and try again.",
      NOT_FOUND:
        "Instagram profile not found. Please check the username and try again.",
      PRIVATE_ACCOUNT:
        "This account is private. Only public profiles can be imported.",
      PARSE_ERROR:
        "Could not parse the Instagram profile data. Instagram may have changed their page structure.",
      NETWORK_ERROR:
        "Could not connect to Instagram. Please check your internet connection and try again.",
      BLOCKED:
        "Instagram is blocking requests from this server. Please try again later.",
      UNKNOWN:
        "An unexpected error occurred while fetching the profile. Please try again.",
    };
    return messages[code];
  }
}

// ─── UI State ────────────────────────────────────────────────

export type InstagramImportState =
  | { step: "input" }
  | { step: "loading"; username: string }
  | { step: "preview"; username: string; data: ParsedInstagramProfile }
  | { step: "saving"; username: string; data: ParsedInstagramProfile }
  | { step: "error"; username: string; errorCode: InstagramErrorCode; errorMessage: string }
  | { step: "success"; username: string };
