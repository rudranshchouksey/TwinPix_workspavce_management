"use client";

import { motion } from "framer-motion";
import { Heart, MessageCircle, PlayCircle, Trophy } from "lucide-react";

interface ContentPerformanceProps {
  posts: any[];
  reels: any[];
  analytics: any;
}

export function ContentPerformance({ posts, reels, analytics }: ContentPerformanceProps) {
  // Find top post based on analytics or fallback to sort
  const topPost = analytics?.topPostId 
    ? posts.find(p => p.id === analytics.topPostId) 
    : [...(posts || [])].sort((a, b) => b.likes - a.likes)[0];
    
  const topReel = analytics?.topReelId 
    ? reels.find(r => r.id === analytics.topReelId) 
    : [...(reels || [])].sort((a, b) => b.views - a.views)[0];

  if (!topPost && !topReel) return null;

  return (
    <div className="col-span-12 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Content Performance</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Post */}
        {topPost && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Trophy className="w-32 h-32" />
            </div>
            
            <div className="w-full sm:w-48 aspect-square rounded-2xl overflow-hidden bg-stone-100 shrink-0 shadow-sm relative border border-[var(--color-border)]">
              {topPost.thumbnail && (
                <img src={topPost.thumbnail} alt="Top Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
              )}
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-600 flex items-center shadow-sm">
                <Trophy className="w-3 h-3 mr-1" /> Best Post
              </div>
            </div>

            <div className="flex flex-col justify-center flex-1 z-10">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl font-bold shadow-sm">
                  <Heart className="w-4 h-4 mr-1.5 fill-rose-600" />
                  {topPost.likes.toLocaleString()}
                </div>
                <div className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl font-bold shadow-sm">
                  <MessageCircle className="w-4 h-4 mr-1.5 fill-emerald-600" />
                  {topPost.comments.toLocaleString()}
                </div>
              </div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                {topPost.caption || "No caption provided for this post."}
              </p>
              <a href={topPost.postUrl} target="_blank" rel="noreferrer" className="mt-auto pt-4 text-sm font-bold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors w-fit">
                View Original Post &rarr;
              </a>
            </div>
          </motion.div>
        )}

        {/* Top Reel */}
        {topReel && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Trophy className="w-32 h-32" />
            </div>

            <div className="w-full sm:w-40 aspect-[9/16] rounded-2xl overflow-hidden bg-stone-100 shrink-0 shadow-sm relative border border-[var(--color-border)]">
              {topReel.thumbnail && (
                <img src={topReel.thumbnail} alt="Top Reel" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
              )}
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-sky-600 flex items-center shadow-sm">
                <Trophy className="w-3 h-3 mr-1" /> Best Reel
              </div>
            </div>

            <div className="flex flex-col justify-center flex-1 z-10">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center text-sky-600 bg-sky-50 px-4 py-2 rounded-xl font-bold shadow-sm w-fit">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  {topReel.views.toLocaleString()} Views
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg font-semibold text-xs shadow-sm">
                    <Heart className="w-3 h-3 mr-1.5 fill-rose-600" />
                    {topReel.likes.toLocaleString()}
                  </div>
                  <div className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-semibold text-xs shadow-sm">
                    <MessageCircle className="w-3 h-3 mr-1.5 fill-emerald-600" />
                    {topReel.comments.toLocaleString()}
                  </div>
                </div>
              </div>
              <a href={topReel.reelUrl} target="_blank" rel="noreferrer" className="mt-auto pt-4 text-sm font-bold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors w-fit">
                Watch Reel &rarr;
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
