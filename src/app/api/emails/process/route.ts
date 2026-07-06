import { NextResponse } from "next/server";
import { EmailService } from "@/services/email.service";

// Ensure this route is not cached and handles requests dynamically
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Process the email queue via the service
    // This handles rendering the React Email and sending via Resend
    const result = await EmailService.processQueue();
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error("[Email Process Route] Error processing emails:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process emails" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Allow GET for easy cron job triggering (e.g. Vercel Cron)
  try {
    const result = await EmailService.processQueue();
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error("[Email Process Route] Error processing emails:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process emails" },
      { status: 500 }
    );
  }
}
