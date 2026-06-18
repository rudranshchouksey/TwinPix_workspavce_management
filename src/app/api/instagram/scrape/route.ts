/**
 * API Route: POST /api/instagram/scrape
 *
 * Scrapes an Instagram profile and returns preview data.
 * Does NOT save to the database — that's a separate server action.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scrapeInstagramProfile } from "@/lib/instagram/scraper";
import { parseInstagramProfile } from "@/lib/instagram/parser";
import { InstagramScraperError } from "@/lib/instagram/types";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Scrape the profile
    const rawData = await scrapeInstagramProfile(username);

    // Parse into normalized format
    const profile = parseInstagramProfile(rawData);

    return NextResponse.json({
      success: true,
      data: profile,
      source: rawData.source,
    });
  } catch (error) {
    if (error instanceof InstagramScraperError) {
      return NextResponse.json(
        {
          error: InstagramScraperError.getDisplayMessage(error.code),
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    console.error("[Instagram Scrape API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again.",
        code: "UNKNOWN",
      },
      { status: 500 }
    );
  }
}
