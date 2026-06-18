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
        className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
      >
        {posts.map((post) => (
          <motion.div 
            variants={item}
            key={post.id} 
            onClick={() => setSelectedPost(post)}
            className="group relative rounded-3xl overflow-hidden border border-[var(--color-border)] bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer block break-inside-avoid"
          >
            {post.thumbnail ? (
              <img 
                src={post.thumbnail} 
                alt={post.caption || "Instagram Post"} 
                className="w-full h-auto object-cover" 
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-stone-100">
                 <ImageIcon className="w-8 h-8 text-stone-300" />
              </div>
            )}
            
            {/* Date badge */}
            {post.publishedDate && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-[var(--color-text-secondary)] flex items-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(post.publishedDate), "MMM d, yyyy")}
              </div>
            )}
            
            {/* Elegant Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
               <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                 <div className="flex items-center gap-4 font-bold text-white mb-2">
                    <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 fill-white" /> {post.likes.toLocaleString()}</span>
                    <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 fill-white" /> {post.comments.toLocaleString()}</span>
                 </div>
                 {post.caption && (
                   <p className="text-sm line-clamp-2 text-stone-200 font-medium">
                     {post.caption}
                   </p>
                 )}
               </div>
               <ExternalLink className="absolute top-4 right-4 w-5 h-5 text-white/50 hover:text-white transition-colors" />
            </div>
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
