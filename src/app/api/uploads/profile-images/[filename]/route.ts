/**
 * API Route: GET /api/uploads/profile-images/[filename]
 *
 * Serves locally stored profile images.
 * Images are stored in uploads/profile-images/ on the filesystem.
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile, access } from "fs/promises";
import path from "path";

const PROFILE_IMAGES_DIR = path.join(process.cwd(), "uploads", "profile-images");

/** Map file extensions to MIME types */
const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent path traversal
    const sanitized = path.basename(filename);
    if (sanitized !== filename || filename.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filepath = path.join(PROFILE_IMAGES_DIR, sanitized);

    // Check file exists
    try {
      await access(filepath);
    } catch {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Read and serve the file
    const buffer = await readFile(filepath);
    const ext = path.extname(sanitized).toLowerCase().replace(".", "");
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[Profile Image] Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
