"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Sparkles,
  SendHorizontal,
  Plus,
  History,
  Trash2,
  X,
  Loader2,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import {
  listCopilotConversationsAction,
  getCopilotConversationAction,
  deleteCopilotConversationAction,
} from "@/actions/copilot";

const STORAGE_KEY = "twinai_conversation_id";

const SUGGESTED_PROMPTS = [
  "Show all active campaigns.",
  "Which influencers have not been contacted in 30 days?",
  "Who has highest engagement in travel category?",
  "Which campaigns are ending this week?",
];

type ToolEvent = {
  tool: string;
  args: any;
  status: "running" | "done";
  result?: any;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  toolEvents?: ToolEvent[];
  streaming?: boolean;
};

interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: Date | string;
  createdAt: Date | string;
}

function toolLabel(tool: string) {
  const labels: Record<string, string> = {
    list_influencers: "Searching influencers",
    list_campaigns: "Searching campaigns",
    list_clients: "Searching clients",
    list_tasks: "Searching tasks",
    get_team_activity: "Checking team activity",
    generate_outreach_for_influencer: "Drafting outreach",
    create_task: "Creating task",
  };
  return labels[tool] || tool;
}

function ToolEventChip({ event }: { event: ToolEvent }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] py-0.5">
      {event.status === "running" ? (
        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
      ) : (
        <CheckCircle2 className="w-3 h-3 text-[var(--color-brand-600)] shrink-0" />
      )}
      <span>{toolLabel(event.tool)}</span>
      {event.status === "done" && event.result?.error && (
        <span className="text-red-500">— {event.result.error}</span>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end px-4 py-1.5">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--color-brand-600)] px-3.5 py-2 text-sm text-white whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex justify-start px-4 py-1.5">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-3.5 py-2 text-sm text-red-700">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2 px-4 py-1.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)]">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-[var(--color-border)] bg-white px-3.5 py-2 text-sm text-[var(--color-text-primary)]">
        {message.toolEvents && message.toolEvents.length > 0 && (
          <div className="mb-1.5 border-b border-[var(--color-border)] pb-1.5">
            {message.toolEvents.map((e, i) => (
              <ToolEventChip key={i} event={e} />
            ))}
          </div>
        )}
        {message.content ? (
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        ) : message.streaming ? (
          <span className="inline-flex items-center gap-1 text-[var(--color-text-secondary)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> thinking…
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function TwinAIPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setConversationId(saved);
      getCopilotConversationAction(saved).then((conv) => {
        if (!conv) return;
        setMessages(mapPersistedMessages(conv.messages));
      });
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  function mapPersistedMessages(rows: any[]): ChatMessage[] {
    const out: ChatMessage[] = [];
    let pendingAssistant: ChatMessage | null = null;

    for (const row of rows) {
      if (row.role === "USER") {
        if (pendingAssistant) out.push(pendingAssistant);
        pendingAssistant = null;
        out.push({ id: row.id, role: "user", content: row.content });
      } else if (row.role === "ASSISTANT" && row.toolName) {
        if (!pendingAssistant) pendingAssistant = { id: row.id, role: "assistant", content: "", toolEvents: [] };
        pendingAssistant.toolEvents!.push({ tool: row.toolName, args: row.toolArgs, status: "running" });
      } else if (row.role === "TOOL") {
        if (pendingAssistant && pendingAssistant.toolEvents?.length) {
          const last = pendingAssistant.toolEvents[pendingAssistant.toolEvents.length - 1];
          last.status = "done";
          last.result = row.toolResult;
        }
      } else if (row.role === "ASSISTANT") {
        if (!pendingAssistant) pendingAssistant = { id: row.id, role: "assistant", content: "", toolEvents: [] };
        pendingAssistant.content = row.content;
        out.push(pendingAssistant);
        pendingAssistant = null;
      }
    }
    if (pendingAssistant) out.push(pendingAssistant);
    return out;
  }

  async function loadHistory() {
    const list = await listCopilotConversationsAction();
    setConversations(list);
    setShowHistory(true);
  }

  async function openConversation(id: string) {
    const conv = await getCopilotConversationAction(id);
    if (!conv) return;
    setConversationId(id);
    localStorage.setItem(STORAGE_KEY, id);
    setMessages(mapPersistedMessages(conv.messages));
    setShowHistory(false);
  }

  function startNewConversation() {
    setConversationId(null);
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setShowHistory(false);
  }

  async function removeConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteCopilotConversationAction(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === conversationId) startNewConversation();
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: trimmed }]);
      setInput("");
      setIsSending(true);

      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", toolEvents: [], streaming: true }]);

      try {
        const res = await fetch("/api/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message: trimmed }),
        });

        if (!res.body) throw new Error("No response stream.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);
            handleStreamEvent(event, assistantId);
          }
        }
      } catch (err: any) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== assistantId),
          { id: assistantId, role: "error", content: err.message || "Twin AI couldn't respond. Please try again." },
        ]);
      } finally {
        setIsSending(false);
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
      }
    },
    [conversationId, isSending]
  );

  function handleStreamEvent(event: any, assistantId: string) {
    switch (event.type) {
      case "conversation":
        setConversationId(event.conversationId);
        localStorage.setItem(STORAGE_KEY, event.conversationId);
        break;
      case "text":
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.value } : m))
        );
        break;
      case "tool_call":
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, toolEvents: [...(m.toolEvents || []), { tool: event.tool, args: event.args, status: "running" }] }
              : m
          )
        );
        break;
      case "tool_result":
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            const events = [...(m.toolEvents || [])];
            const idx = events.findIndex((e) => e.tool === event.tool && e.status === "running");
            if (idx >= 0) events[idx] = { ...events[idx], status: "done", result: event.result };
            return { ...m, toolEvents: events };
          })
        );
        break;
      case "error":
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, role: "error", content: event.message, streaming: false } : m
          )
        );
        break;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] shadow-lg shadow-[var(--color-brand-600)]/30"
            aria-label="Open Twin AI"
          >
            <Bot className="h-6 w-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400">
              <Sparkles className="h-2.5 w-2.5 text-amber-900" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-0,#fff)] shadow-2xl sm:w-[420px]"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">Twin AI</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] leading-tight">Agency Copilot</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={startNewConversation} title="New chat">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={loadHistory} title="History">
                  <History className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)} title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showHistory && (
              <div className="absolute right-4 top-14 z-10 max-h-80 w-[calc(100%-2rem)] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white shadow-xl">
                {conversations.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">
                    No past conversations yet.
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openConversation(c.id)}
                      className="flex w-full items-center justify-between gap-2 border-b border-[var(--color-border)] px-3.5 py-2.5 text-left text-sm last:border-b-0 hover:bg-[var(--color-brand-50)]"
                    >
                      <span className="truncate text-[var(--color-text-primary)]">
                        {c.title || "Untitled conversation"}
                      </span>
                      <Trash2
                        className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)] hover:text-red-600"
                        onClick={(e) => removeConversation(c.id, e)}
                      />
                    </button>
                  ))
                )}
              </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto py-2" onClick={() => showHistory && setShowHistory(false)}>
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)]">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">Hi, I&apos;m Twin AI</div>
                    <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      Ask me about influencers, campaigns, clients, or tasks — or have me take action.
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => sendMessage(p)}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-brand-50)]/40 px-3 py-2 text-left text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-brand-50)]"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} message={m} />)
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-[var(--color-border)] p-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask Twin AI anything…"
                rows={1}
                disabled={isSending}
                className="flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-500)] disabled:opacity-60"
              />
              <Button type="submit" size="icon" disabled={isSending || !input.trim()}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
