"use client";

import React, { useEffect, useState } from "react";
import { submitFeedbackAction, getUserFeedbackAction } from "@/actions/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { Loader2, MessageSquareText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const fetchFeedback = async () => {
    setLoading(true);
    const result = await getUserFeedbackAction();
    setFeedbackList(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const result = await submitFeedbackAction(subject, content);
    if (result.success) {
      toast.success("Feedback submitted successfully!");
      setSubject("");
      setContent("");
      fetchFeedback();
    } else {
      toast.error(result.error || "Failed to submit feedback");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Feedback & Support"
        description="Share your thoughts, report issues, or request new features"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Submit Form */}
        <PremiumCard className="p-6 shadow-executive-lg border-0">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Submit Feedback</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your feedback"
                className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Details
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Provide as much detail as possible..."
                rows={5}
                className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] resize-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !content.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Feedback"}
            </button>
          </form>
        </PremiumCard>

        {/* History */}
        <PremiumCard className="p-6 shadow-executive-lg border-0 flex flex-col">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Your History</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-400)]" />
              </div>
            ) : feedbackList.length > 0 ? (
              feedbackList.map((item) => (
                <div key={item.id} className="p-4 bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.05)] rounded-xl relative overflow-hidden group">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{item.subject}</h4>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{item.content}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      item.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400' : 
                      item.status === 'REVIEWED' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 text-[10px] text-[var(--color-text-disabled)] font-medium">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 opacity-60">
                <MessageSquareText className="w-10 h-10 mb-3" />
                <p className="text-sm text-[var(--color-text-muted)]">No feedback submitted yet.</p>
              </div>
            )}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
