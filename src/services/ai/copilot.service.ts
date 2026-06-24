import OpenAI from "openai";
import { db } from "@/lib/db";
import { COPILOT_TOOLS, executeCopilotTool } from "./copilot-tools";

const SYSTEM_PROMPT = `You are Twin AI, the central operating assistant for TwinPix, an influencer-marketing agency. You help the team query and manage influencers, campaigns, clients, and tasks, and you can create tasks and draft outreach when asked.

Rules:
- Always use the provided tools to look up real data — never invent influencer names, numbers, or stats.
- When asked to create something (a task, outreach, etc.), actually call the corresponding tool — don't just describe what you would do.
- After a tool returns results, summarize them concisely and conversationally. Use names and concrete numbers from the tool result.
- If a tool returns an error (e.g. a person or entity couldn't be found), tell the user plainly and suggest they double-check the name.
- Keep answers tight and scannable — short paragraphs or bullet points, not walls of text.
- Today's date is ${new Date().toISOString().split("T")[0]}.`;

const MAX_TOOL_ROUNDS = 3;
const HISTORY_MESSAGE_LIMIT = 20;

export type CopilotStreamEvent =
  | { type: "conversation"; conversationId: string }
  | { type: "text"; value: string }
  | { type: "tool_call"; tool: string; args: any }
  | { type: "tool_result"; tool: string; result: any }
  | { type: "done" }
  | { type: "error"; message: string };

interface AccumulatedToolCall {
  id: string;
  name: string;
  arguments: string;
}

export class CopilotService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async *streamTurn(
    conversationId: string | null,
    userMessage: string,
    userId: string
  ): AsyncGenerator<CopilotStreamEvent> {
    if (!this.client) {
      yield { type: "error", message: "OPENAI_API_KEY is not set. Twin AI requires an OpenAI API key." };
      return;
    }

    const prisma = db as any;

    let conversation = conversationId
      ? await prisma.copilotConversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conversation) {
      conversation = await prisma.copilotConversation.create({
        data: { userId, title: userMessage.slice(0, 80) },
      });
    }

    yield { type: "conversation", conversationId: conversation.id };

    await prisma.copilotMessage.create({
      data: { conversationId: conversation.id, role: "USER", content: userMessage },
    });

    const history = await prisma.copilotMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_MESSAGE_LIMIT,
    });
    history.reverse();

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history
        .filter((m: any) => m.role === "USER" || m.role === "ASSISTANT")
        .map((m: any) => ({
          role: m.role === "USER" ? "user" : "assistant",
          content: m.content,
        })),
    ];

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    let finalText = "";

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const stream = await this.client.chat.completions.create({
          model,
          messages,
          tools: COPILOT_TOOLS,
          stream: true,
        });

        let roundText = "";
        const toolCalls = new Map<number, AccumulatedToolCall>();
        let finishReason: string | null = null;

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          finishReason = chunk.choices[0]?.finish_reason ?? finishReason;

          if (delta?.content) {
            roundText += delta.content;
            yield { type: "text", value: delta.content };
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const existing = toolCalls.get(tc.index) || { id: "", name: "", arguments: "" };
              if (tc.id) existing.id = tc.id;
              if (tc.function?.name) existing.name = tc.function.name;
              if (tc.function?.arguments) existing.arguments += tc.function.arguments;
              toolCalls.set(tc.index, existing);
            }
          }
        }

        finalText += roundText;

        if (finishReason !== "tool_calls" || toolCalls.size === 0) {
          break;
        }

        const calls = Array.from(toolCalls.values());

        messages.push({
          role: "assistant",
          content: roundText || null,
          tool_calls: calls.map((c) => ({
            id: c.id,
            type: "function" as const,
            function: { name: c.name, arguments: c.arguments },
          })),
        });

        for (const call of calls) {
          let args: Record<string, any> = {};
          try {
            args = JSON.parse(call.arguments || "{}");
          } catch {
            args = {};
          }

          yield { type: "tool_call", tool: call.name, args };

          await prisma.copilotMessage.create({
            data: {
              conversationId: conversation.id,
              role: "ASSISTANT",
              content: "",
              toolName: call.name,
              toolArgs: args,
            },
          });

          let result: any;
          try {
            result = await executeCopilotTool(call.name, args, { userId });
          } catch (err: any) {
            result = { error: err.message || "Tool execution failed" };
          }

          yield { type: "tool_result", tool: call.name, result };

          await prisma.copilotMessage.create({
            data: {
              conversationId: conversation.id,
              role: "TOOL",
              content: JSON.stringify(result),
              toolName: call.name,
              toolResult: result,
            },
          });

          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        }
      }
    } catch (error: any) {
      yield { type: "error", message: error.message || "Twin AI ran into an error." };
      return;
    }

    await prisma.copilotMessage.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: finalText },
    });

    await prisma.copilotConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    yield { type: "done" };
  }
}
