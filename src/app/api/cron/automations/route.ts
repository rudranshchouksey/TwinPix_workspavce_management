import { NextResponse } from "next/server";
import { AutomationService } from "@/services/automation.service";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Check if CRON_SECRET is configured. If so, validate it.
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Run the automation engine
    await AutomationService.runAll();

    return NextResponse.json({ success: true, message: "Automations executed successfully" });
  } catch (error: any) {
    console.error("[Cron Route] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
