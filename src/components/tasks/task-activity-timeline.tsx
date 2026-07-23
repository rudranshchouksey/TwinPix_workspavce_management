"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Zap, Clock, User as UserIcon, Tag, CheckCircle2, AlertCircle, FileText, CornerDownRight, MoreHorizontal, Pencil, Trash, CheckSquare, Folder, Briefcase, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addTaskCommentAction, updateTaskCommentAction, deleteTaskCommentAction } from "@/actions/tasks";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TimelineProps {
  taskId: string;
  activities: any[];
  comments: any[];
  currentUser: any;
}

export function TaskActivityTimeline({ taskId, activities, comments, currentUser }: TimelineProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "COMMENTS" | "CHANGES">("ALL");

  // Group comments by parent
  const topLevelComments = comments.filter(c => !c.parentId);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, any[]>);

  // Merge activities and top level comments, sort ascending by date
  const timelineEvents = [
    ...activities.map(a => ({ ...a, eventType: "ACTIVITY" })),
    ...topLevelComments.map(c => ({ ...c, eventType: "COMMENT" }))
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const filteredEvents = timelineEvents.filter(event => {
    if (filter === "ALL") return true;
    if (filter === "COMMENTS") return event.eventType === "COMMENT";
    if (filter === "CHANGES") return event.eventType === "ACTIVITY";
    return true;
  });

  const handleAddComment = async (parentId?: string) => {
    const text = parentId ? newComment : newComment;
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await addTaskCommentAction(taskId, { content: text, parentId, attachments: [] });
      toast.success("Comment added");
      setNewComment("");
      setReplyTo(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteTaskCommentAction(commentId);
      toast.success("Comment deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "STATUS_CHANGED": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "PRIORITY_CHANGED": return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "ASSIGNEE_CHANGED": return <UserIcon className="w-4 h-4 text-blue-500" />;
      case "DUE_DATE_CHANGED": return <Clock className="w-4 h-4 text-indigo-500" />;
      case "CREATED": return <Zap className="w-4 h-4 text-purple-500" />;
      case "EDITED": return <Pencil className="w-4 h-4 text-blue-400" />;
      case "CHECKLIST_UPDATED": return <CheckSquare className="w-4 h-4 text-teal-500" />;
      case "CAMPAIGN_CHANGED": return <Folder className="w-4 h-4 text-orange-500" />;
      case "PROJECT_CHANGED": return <Briefcase className="w-4 h-4 text-pink-500" />;
      case "ATTACHMENT_ADDED": return <Paperclip className="w-4 h-4 text-cyan-500" />;
      default: return <Tag className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderComment = (comment: any, isReply = false) => {
    const canEdit = comment.userId === currentUser.id || currentUser.role === "SUPER_ADMIN";
    
    return (
      <div key={comment.id} className={`flex gap-4 ${isReply ? 'mt-4' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0 overflow-hidden border border-[rgba(0,0,0,0.08)]">
          {comment.user.image ? (
            <img src={comment.user.image} alt={comment.user.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-4 h-4 text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm overflow-hidden group">
            <div className="bg-[rgba(0,0,0,0.02)] px-4 py-2 border-b border-[rgba(0,0,0,0.04)] flex items-center justify-between">
              <div className="text-xs">
                <span className="font-semibold text-[var(--color-text-primary)]">{comment.user.name || comment.user.email}</span>
                <span className="text-[var(--color-text-muted)] ml-2">
                  commented {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteComment(comment.id)}>
                      <Trash className="w-3 h-3 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="p-4 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
              {comment.content}
            </div>
          </div>
          
          {!isReply && (
            <div className="mt-2 ml-2">
              <button 
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center"
              >
                <CornerDownRight className="w-3 h-3 mr-1" />
                Reply
              </button>
            </div>
          )}

          {/* Render Replies */}
          {repliesByParent[comment.id] && (
            <div className="ml-4 border-l-2 border-[rgba(0,0,0,0.06)] pl-4 mt-4 space-y-4">
              {repliesByParent[comment.id].map((reply: any) => renderComment(reply, true))}
            </div>
          )}

          {/* Reply Input */}
          {replyTo === comment.id && (
            <div className="mt-4 ml-4 flex gap-3">
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[80px] text-sm resize-none"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button>
                  <Button size="sm" onClick={() => handleAddComment(comment.id)} disabled={isSubmitting || !newComment.trim()}>
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-[rgba(0,0,0,0.06)] pb-4">
        <Button 
          variant={filter === "ALL" ? "secondary" : "ghost"} 
          size="sm" 
          onClick={() => setFilter("ALL")}
          className="text-xs rounded-full h-7 px-3 font-semibold"
        >
          Everything
        </Button>
        <Button 
          variant={filter === "COMMENTS" ? "secondary" : "ghost"} 
          size="sm" 
          onClick={() => setFilter("COMMENTS")}
          className="text-xs rounded-full h-7 px-3 font-semibold"
        >
          Only Comments
        </Button>
        <Button 
          variant={filter === "CHANGES" ? "secondary" : "ghost"} 
          size="sm" 
          onClick={() => setFilter("CHANGES")}
          className="text-xs rounded-full h-7 px-3 font-semibold"
        >
          Only Changes
        </Button>
      </div>

      <div className="space-y-8 relative pl-2">
        <div className="absolute top-4 bottom-8 left-[23px] w-0.5 bg-[rgba(0,0,0,0.06)] -z-10" />

        {filteredEvents.map((event) => {
        if (event.eventType === "ACTIVITY") {
          return (
            <div key={`act-${event.id}`} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white border border-[rgba(0,0,0,0.1)] flex items-center justify-center shrink-0 shadow-sm relative z-10">
                {getActivityIcon(event.type)}
              </div>
              <div className="pt-1.5 text-sm">
                <span className="font-semibold text-[var(--color-text-primary)]">{event.user?.name || event.user?.email || "Someone"}</span>
                <span className="text-[var(--color-text-secondary)] mx-1">{event.details}</span>
                <span className="text-[var(--color-text-disabled)] text-xs ml-2">
                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        } else {
          return renderComment(event);
        }
      })}
      </div>

      {/* New top-level comment */}
      <div className="flex gap-4 pt-4 border-t border-[rgba(0,0,0,0.08)]">
        <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0 border border-[rgba(0,0,0,0.08)]">
          {currentUser.image ? (
            <img src={currentUser.image} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-4 h-4 text-gray-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-brand-500)] focus-within:border-transparent transition-all">
            <Textarea
              value={!replyTo ? newComment : ""}
              onChange={(e) => {
                if (!replyTo) setNewComment(e.target.value);
              }}
              placeholder="Leave a comment..."
              className="min-h-[100px] border-0 focus-visible:ring-0 text-sm resize-none rounded-none"
            />
            <div className="bg-[rgba(0,0,0,0.02)] px-4 py-2 border-t border-[rgba(0,0,0,0.04)] flex justify-between items-center">
              <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Markdown supported
              </div>
              <Button size="sm" onClick={() => handleAddComment()} disabled={isSubmitting || !!replyTo || !newComment.trim()}>
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
