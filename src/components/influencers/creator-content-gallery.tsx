"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Image as ImageIcon, PlayCircle } from "lucide-react";
import { InfluencerPostsGrid } from "./influencer-posts-grid";
import { InfluencerReelsGrid } from "./influencer-reels-grid";
import { ContentPerformance } from "./content-performance";

interface CreatorContentGalleryProps {
  posts: any[];
  reels: any[];
  analytics: any;
  influencerHandle: string;
}

export function CreatorContentGallery({ posts, reels, analytics, influencerHandle }: CreatorContentGalleryProps) {
  return (
    <div className="col-span-12 flex flex-col gap-6">
      <ContentPerformance posts={posts} reels={reels} analytics={analytics} />

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="bg-stone-100/80 p-1 w-fit">
          <TabsTrigger value="posts" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" /> Feed Posts
          </TabsTrigger>
          <TabsTrigger value="reels" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 flex items-center gap-2">
            <PlayCircle className="w-3.5 h-3.5" /> Reels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6 outline-none">
          <InfluencerPostsGrid posts={posts} influencerHandle={influencerHandle} />
        </TabsContent>

        <TabsContent value="reels" className="mt-6 outline-none">
          <InfluencerReelsGrid reels={reels} influencerHandle={influencerHandle} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
