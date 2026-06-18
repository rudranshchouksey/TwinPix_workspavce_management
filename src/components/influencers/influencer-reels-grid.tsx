"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { PlayCircle, Heart, MessageCircle, ExternalLink, Calendar } from "lucide-react";
import { ContentDetailModal } from "./content-detail-modal";
import { format } from "date-fns";

interface ReelsGridProps {
  reels: any[];
  influencerHandle: string;
}

export function InfluencerReelsGrid({ reels, influencerHandle }: ReelsGridProps) {
  const [selectedReel, setSelectedReel] = useState<any | null>(null);

  if (!reels || reels.length === 0) {
    return (
      <div className="col-span-12 flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-[var(--color-border)] bg-stone-50 shadow-sm">
        <PlayCircle className="h-10 w-10 text-[var(--color-text-muted)] mb-4" />
        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No Reels Synced</h3>
        <p className="mt-2 text-[var(--color-text-muted)] max-w-sm font-medium">
          Click the &quot;Refresh Data&quot; button to pull the latest reels for @{influencerHandle}.
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
          Recent Reels
          <span className="ml-2 text-sm font-medium text-[var(--color-text-muted)]">({reels.length})</span>
        </h2>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        {reels.map((reel) => (
          <motion.div 
            variants={item}
            key={reel.id} 
            onClick={() => setSelectedReel(reel)}
            className="group relative rounded-3xl overflow-hidden border border-[var(--color-border)] bg-stone-100 aspect-[9/16] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer block"
          >
            {reel.thumbnail ? (
              <img 
                src={reel.thumbnail} 
                alt="Instagram Reel" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-200">
                 <PlayCircle className="w-8 h-8 text-stone-400" />
              </div>
            )}
            
            {/* Date badge */}
            {reel.publishedDate && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold text-[var(--color-text-secondary)] flex items-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Calendar className="w-2.5 h-2.5 mr-1" />
                {format(new Date(reel.publishedDate), "MMM d")}
              </div>
            )}
            
            {/* Always visible bottom gradient for metrics */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
            
            {/* Glassmorphism hover overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <PlayCircle className="w-16 h-16 text-white opacity-90 drop-shadow-md" />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2 text-white z-10 group-hover:translate-y-1 transition-transform">
               <div className="flex items-center gap-2 font-bold text-lg drop-shadow-md">
                  <PlayCircle className="w-5 h-5 fill-white/20" /> 
                  {reel.views.toLocaleString()}
               </div>
               <div className="flex items-center gap-4 font-semibold text-xs text-white/90 drop-shadow-md">
                  <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 fill-white/80" /> {reel.likes.toLocaleString()}</span>
                  <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 fill-white/80" /> {reel.comments.toLocaleString()}</span>
               </div>
            </div>

            <ExternalLink className="absolute top-4 right-4 w-5 h-5 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10" />
          </motion.div>
        ))}
      </motion.div>

      {/* Content Detail Modal */}
      <ContentDetailModal
        isOpen={!!selectedReel}
        onClose={() => setSelectedReel(null)}
        content={
          selectedReel
            ? {
                type: "reel",
                thumbnail: selectedReel.thumbnail,
                likes: selectedReel.likes,
                comments: selectedReel.comments,
                views: selectedReel.views,
                publishedDate: selectedReel.publishedDate,
                url: selectedReel.reelUrl,
              }
            : null
        }
      />
    </div>
  );
}
