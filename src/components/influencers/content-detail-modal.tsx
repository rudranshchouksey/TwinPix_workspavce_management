"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  MessageCircle,
  PlayCircle,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ContentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    type: "post" | "reel";
    thumbnail?: string;
    caption?: string;
    likes: number;
    comments: number;
    views?: number;
    publishedDate: string | Date;
    url: string;
  } | null;
}

export function ContentDetailModal({ isOpen, onClose, content }: ContentDetailModalProps) {
  if (!content) return null;

  const publishDate = content.publishedDate
    ? format(new Date(content.publishedDate), "MMMM d, yyyy 'at' h:mm a")
    : "Unknown date";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-3xl shadow-2xl border border-[var(--color-border)] overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-900)] shrink-0">
                <div className="flex items-center gap-2">
                  {content.type === "reel" ? (
                    <PlayCircle className="w-5 h-5 text-[var(--color-brand-600)]" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-[var(--color-brand-600)]" />
                  )}
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                    {content.type === "reel" ? "Reel Details" : "Post Details"}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-[var(--color-surface-800)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1">
                {/* Image */}
                {content.thumbnail && (
                  <div className="bg-stone-100 relative">
                    <img
                      src={content.thumbnail}
                      alt={content.caption || "Content"}
                      className={`w-full object-cover ${
                        content.type === "reel" ? "max-h-[400px]" : "max-h-[500px]"
                      }`}
                    />
                  </div>
                )}

                <div className="p-6 space-y-5">
                  {/* Metrics Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    {content.views !== undefined && content.views > 0 && (
                      <div className="flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm border border-sky-100">
                        <PlayCircle className="w-4 h-4" />
                        {content.views.toLocaleString()} views
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm border border-rose-100">
                      <Heart className="w-4 h-4 fill-rose-600" />
                      {content.likes.toLocaleString()} likes
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm border border-emerald-100">
                      <MessageCircle className="w-4 h-4 fill-emerald-600" />
                      {content.comments.toLocaleString()} comments
                    </div>
                  </div>

                  {/* Published Date */}
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
                    <Calendar className="w-4 h-4" />
                    {publishDate}
                  </div>

                  {/* Caption */}
                  {content.caption && (
                    <div className="bg-[var(--color-surface-900)] rounded-2xl p-4 border border-[var(--color-border)]">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                        {content.caption}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 shrink-0">
                <a
                  href={content.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                >
                  <Button className="w-full bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-500)] hover:from-[var(--color-brand-700)] hover:to-[var(--color-brand-600)] text-white font-bold rounded-2xl shadow-md">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open on Instagram
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
