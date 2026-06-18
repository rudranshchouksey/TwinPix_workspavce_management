"use server";

import { InstagramSyncService, SyncResult } from "@/services/instagram/instagram-sync.service";
import { revalidatePath } from "next/cache";

export async function syncInfluencerAction(influencerId: string): Promise<{
  success: boolean;
  error?: string;
  details?: SyncResult;
}> {
  try {
    const syncService = new InstagramSyncService();
    const result = await syncService.syncInfluencer(influencerId);
    
    revalidatePath(`/influencers/${influencerId}`);
    revalidatePath("/influencers");
    
    return { 
      success: true, 
      details: result,
    };
  } catch (error: any) {
    console.error("[syncInfluencerAction] Failed:", error);
    return { 
      success: false, 
      error: error.message || "Failed to sync influencer profile" 
    };
  }
}
