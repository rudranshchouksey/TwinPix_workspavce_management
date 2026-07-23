import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from CLOUDINARY_URL env var
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
}

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 */
function uploadBufferToCloudinary(
  buffer: Buffer,
  publicId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          unique_filename: false,
          resource_type: "auto",
          folder: "twinpix/client-files",
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result.secure_url);
          else reject(new Error("No result returned from Cloudinary"));
        }
      )
      .end(buffer);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    // Verify client exists
    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Basic security validation
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.\w+$/, "");
    const timestamp = Date.now();
    const publicId = `${clientId}/${timestamp}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    let fileUrl: string;

    if (process.env.CLOUDINARY_URL) {
      fileUrl = await uploadBufferToCloudinary(buffer, publicId);
    } else {
      // Development fallback
      console.warn("[client-files] CLOUDINARY_URL not set — file will not persist in production");
      fileUrl = `/uploads/client-files/${clientId}/${timestamp}-${safeName}`;
    }

    // Log the activity
    await db.clientActivity.create({
      data: {
        clientId,
        userId: user.id,
        type: "FILE_UPLOADED",
        details: `Uploaded file: ${file.name}`,
        metadata: JSON.stringify({
          filename: publicId,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          url: fileUrl,
        }),
      },
    });

    return NextResponse.json({ 
      success: true, 
      filename: publicId,
      originalName: file.name,
      url: fileUrl,
    });

  } catch (error: unknown) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    // Query client activities for uploaded files instead of reading from filesystem
    const activities = await db.clientActivity.findMany({
      where: {
        clientId,
        type: "FILE_UPLOADED",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        details: true,
        metadata: true,
        createdAt: true,
      },
    });

    const files = activities.map((activity) => {
      let meta: Record<string, unknown> = {};
      try {
        if (activity.metadata) {
          meta = JSON.parse(activity.metadata);
        }
      } catch {
        // metadata parse failure is non-fatal
      }
      return {
        filename: meta.filename || meta.originalName || "unknown",
        originalName: meta.originalName || activity.details?.replace("Uploaded file: ", ""),
        size: meta.size || 0,
        url: meta.url || null,
        createdAt: activity.createdAt,
      };
    });

    return NextResponse.json({ files });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
