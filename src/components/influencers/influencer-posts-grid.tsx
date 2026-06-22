"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Heart, MessageCircle, ExternalLink, Image as ImageIcon, Calendar } from "lucide-react";
import { ContentDetailModal } from "./content-detail-modal";
import { format } from "date-fns";

interface PostsGridProps {
  posts: any[];
  influencerHandle: string;
}

export function InfluencerPostsGrid({ posts, influencerHandle }: PostsGridProps) {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  if (!posts || posts.length === 0) {
    return (
      <div className="col-span-12 flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-[var(--color-border)] bg-stone-50 shadow-sm">
        <ImageIcon className="h-10 w-10 text-[var(--color-text-muted)] mb-4" />
        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No Feed Posts</h3>
        <p className="mt-2 text-[var(--color-text-muted)] max-w-sm font-medium">
          Click the &quot;Refresh Data&quot; button at the top to pull the latest posts for @{influencerHandle}.
        </p>
      </div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="col-span-12 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          Recent Feed Posts
          <span className="ml-2 text-sm font-medium text-[var(--color-text-muted)]">({posts.length})</span>
        </h2>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2"
      >
        {posts.map((post) => (
          <motion.div
            variants={item}
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="group relative aspect-square rounded-lg overflow-hidden border border-[var(--color-border)] bg-stone-100 cursor-pointer"
          >
            {post.thumbnail ? (
              <img
                src={post.thumbnail}
                alt={post.caption || "Instagram Post"}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                 <ImageIcon className="w-8 h-8 text-stone-300" />
              </div>
            )}

            {/* Date badge */}
            {post.publishedDate && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-semibold text-white flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(post.publishedDate), "MMM d, yyyy")}
              </div>
            )}

            {/* Instagram-style centered stats overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-5 opacity-0 group-hover:opacity-100">
              <span className="flex items-center gap-1.5 font-bold text-white text-sm">
                <Heart className="w-4 h-4 fill-white" /> {post.likes.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-white text-sm">
                <MessageCircle className="w-4 h-4 fill-white" /> {post.comments.toLocaleString()}
              </span>
            </div>

            <ExternalLink className="absolute top-2 right-2 w-3.5 h-3.5 text-white/0 group-hover:text-white/80 transition-colors" />
          </motion.div>
        ))}
      </motion.div>

      {/* Content Detail Modal */}
      <ContentDetailModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        content={
          selectedPost
            ? {
                type: "post",
                thumbnail: selectedPost.thumbnail,
                caption: selectedPost.caption,
                likes: selectedPost.likes,
                comments: selectedPost.comments,
                publishedDate: selectedPost.publishedDate,
                url: selectedPost.postUrl,
              }
            : null
        }
      />
    </div>
  );
}
