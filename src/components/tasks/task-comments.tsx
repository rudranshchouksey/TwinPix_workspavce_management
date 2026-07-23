"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { taskCommentSchema, TaskCommentInput } from "@/lib/validations/task";
import { addTaskCommentAction, deleteTaskCommentAction } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TaskCommentsProps {
  taskId: string;
  comments: any[];
  currentUser: any;
}

export function TaskComments({ taskId, comments, currentUser }: TaskCommentsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaskCommentInput>({
    resolver: zodResolver(taskCommentSchema),
    defaultValues: {
      content: "",
      attachments: [],
      parentId: null,
    },
  });

  const onSubmit = async (data: TaskCommentInput) => {
    setIsSubmitting(true);
    try {
      await addTaskCommentAction(taskId, data);
      form.reset();
      toast.success("Comment added");
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteTaskCommentAction(commentId);
      toast.success("Comment deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete comment");
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Comments ({comments.length})</h3>

      <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {comments.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] italic">No comments yet. Start the conversation!</p>
        ) : (
          comments.map((comment) => {
            const isOwner = comment.userId === currentUser?.id || currentUser?.role === "SUPER_ADMIN";
            
            return (
              <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.05)] group">
                <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.1)] flex items-center justify-center shrink-0 overflow-hidden">
                  {comment.user?.image ? (
                    <img src={comment.user.image} alt={comment.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[var(--color-text-primary)]">
                        {comment.user?.name || "Unknown User"}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-[var(--color-text-muted)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-4 border-t border-[rgba(0,0,0,0.08)]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
          <Textarea
            placeholder="Add a comment..."
            {...form.register("content")}
            className="w-full min-h-[80px] pb-12 resize-none bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus-visible:ring-[var(--color-brand-500)] text-sm"
          />
          <div className="absolute bottom-3 right-3">
            <Button 
              type="submit" 
              size="sm"
              disabled={isSubmitting || !form.watch("content")?.trim()}
              className="bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] h-8 px-3"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
