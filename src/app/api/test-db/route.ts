import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "cmqpefaog008f04lapakvjty6";
  
  try {
    const influencer = await (db as any).influencer.findUnique({
      where: { id },
      include: {
        campaigns: true,
        recentPosts: true,
        recentReels: true,
        analytics: true,
        creatorIntelligence: true,
        assignedManager: true,
        metricSnapshots: true,
      }
    });

    return NextResponse.json({
      success: true,
      found: !!influencer,
      id,
      influencerName: influencer?.influencerName,
      status: influencer?.status,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
