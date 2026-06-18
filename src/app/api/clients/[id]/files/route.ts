import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "client-files");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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
    const ext = path.extname(file.name).toLowerCase();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${Date.now()}-${safeName}`;
    
    // Create client-specific directory
    const clientDir = path.join(UPLOAD_DIR, clientId);
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
    }

    const filePath = path.join(clientDir, uniqueFilename);
    const writeStream = fs.createWriteStream(filePath);

    // Node 20+ generic Web Streams support
    // @ts-ignore
    await pipeline(file.stream(), writeStream);

    // Log the activity
    await db.clientActivity.create({
      data: {
        clientId,
        userId: user.id,
        type: "FILE_UPLOADED",
        details: `Uploaded file: ${file.name}`,
        metadata: JSON.stringify({ filename: uniqueFilename, originalName: file.name, size: file.size, mimeType: file.type }),
      },
    });

    return NextResponse.json({ 
      success: true, 
      filename: uniqueFilename,
      originalName: file.name
    });

  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    const clientDir = path.join(UPLOAD_DIR, clientId);
    
    if (!fs.existsSync(clientDir)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(clientDir).map(filename => {
      const stats = fs.statSync(path.join(clientDir, filename));
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    });

    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
