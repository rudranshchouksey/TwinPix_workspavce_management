/**
 * API Route: POST /api/copilot
 *
 * Streams a Twin AI chat turn as newline-delimited JSON (NDJSON) events:
 * {"type":"conversation","conversationId":"..."}
 * {"type":"text","value":"..."}            (repeated, token-by-token)
 * {"type":"tool_call","tool":"...","args":{...}}
 * {"type":"tool_result","tool":"...","result":{...}}
 * {"type":"done"} | {"type":"error","message":"..."}
 *
 * Hand-rolled rather than SSE since the client only needs one-directional
 * chunked text, and NDJSON avoids pulling in an extra streaming library.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CopilotService } from "@/services/ai/copilot.service";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const { conversationId, message } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const service = new CopilotService();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of service.streamTurn(conversationId || null, message, session.user.id)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
      } catch (error: any) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "error", message: error.message || "Unexpected error" }) + "\n")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
