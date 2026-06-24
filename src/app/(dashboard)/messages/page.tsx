"use client";

import React, { useEffect, useState, useRef } from "react";
import { getUsersListAction, getConversationAction, sendMessageAction, markConversationAsReadAction } from "@/actions/messages";
import { useSession } from "next-auth/react";
import { Search, Send, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { PremiumCard } from "@/components/ui/premium-card";

export default function MessagesPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const list = await getUsersListAction();
      setUsers(list);
      setLoadingUsers(false);
    };
    fetchUsers();
  }, []);

  // Fetch conversation when user is selected
  useEffect(() => {
    if (!selectedUser) return;
    let isMounted = true;
    
    const fetchChat = async () => {
      setLoadingMessages(true);
      const chat = await getConversationAction(selectedUser.id);
      if (isMounted) setMessages(chat);
      setLoadingMessages(false);
      // Mark as read
      await markConversationAsReadAction(selectedUser.id);
    };

    fetchChat();

    // Simple polling for new messages every 5 seconds
    const interval = setInterval(async () => {
      const chat = await getConversationAction(selectedUser.id);
      if (isMounted) {
        setMessages(chat);
        markConversationAsReadAction(selectedUser.id);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const tempMessage = {
      id: "temp-" + Date.now(),
      content: newMessage,
      senderId: currentUserId,
      receiverId: selectedUser.id,
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: {
        id: currentUserId,
        name: session?.user?.name,
        image: session?.user?.image,
      }
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    setSending(true);

    const result = await sendMessageAction(selectedUser.id, tempMessage.content);
    if (!result.success) {
      // Revert if failed (optimistic UI)
      setMessages((prev) => prev.filter(m => m.id !== tempMessage.id));
    }
    setSending(false);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PremiumCard className="flex h-[calc(100vh-8rem)] p-0 overflow-hidden shadow-executive-lg border-0">
      
      {/* Sidebar: Users List */}
      <div className="w-1/3 min-w-[280px] max-w-[360px] flex flex-col border-r border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)]">
        <div className="p-4 border-b border-[rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-disabled)]" />
            <input
              type="text"
              placeholder="Search colleagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-lg pl-9 pr-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingUsers ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No users found.</div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                    selectedUser?.id === u.id 
                      ? "bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)]" 
                      : "hover:bg-[rgba(0,0,0,0.03)] border border-transparent"
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0 border border-[rgba(0,0,0,0.1)]">
                    <AvatarImage src={u.image} />
                    <AvatarFallback className="bg-[var(--color-surface-700)] text-[var(--color-text-secondary)] text-xs font-semibold">
                      {u.name?.substring(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{u.name}</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)] truncate block">{u.role.replace('_', ' ')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Chat Room */}
      <div className="flex-1 flex flex-col bg-transparent">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[rgba(0,0,0,0.08)] flex items-center gap-3 bg-[rgba(0,0,0,0.01)] shrink-0">
              <Avatar className="h-10 w-10 shrink-0 border border-[rgba(0,0,0,0.1)]">
                <AvatarImage src={selectedUser.image} />
                <AvatarFallback className="bg-[var(--color-surface-700)] text-[var(--color-text-secondary)] font-semibold">
                  {selectedUser.name?.substring(0, 2).toUpperCase() || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{selectedUser.name}</h3>
                <span className="text-xs text-[var(--color-text-muted)]">{selectedUser.email}</span>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 border-2 border-[var(--color-brand-400)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.senderId === currentUserId;
                  const showAvatar = !isMine && (i === messages.length - 1 || messages[i + 1]?.senderId === currentUserId);
                  return (
                    <div key={msg.id} className={cn("flex items-end gap-2", isMine ? "justify-end" : "justify-start")}>
                      {!isMine && (
                        <div className="w-8 shrink-0">
                          {showAvatar && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.sender?.image} />
                              <AvatarFallback className="bg-[var(--color-surface-700)] text-[10px]">{msg.sender?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm",
                        isMine 
                          ? "bg-[var(--color-brand-500)] text-white rounded-br-sm" 
                          : "bg-[rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.04)] text-[var(--color-text-primary)] rounded-bl-sm"
                      )}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn(
                          "text-[9px] mt-1 text-right font-medium",
                          isMine ? "text-white/70" : "text-[var(--color-text-disabled)]"
                        )}>
                          {format(new Date(msg.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.01)] shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-full pl-4 pr-12 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] transition-shadow"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] space-y-4">
            <div className="p-6 bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.05)] rounded-full">
              <MessageSquare className="h-10 w-10 opacity-50" />
            </div>
            <p className="text-lg font-medium">Select a colleague to start chatting</p>
          </div>
        )}
      </div>

    </PremiumCard>
  );
}
