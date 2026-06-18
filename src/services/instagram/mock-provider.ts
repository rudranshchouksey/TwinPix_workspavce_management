import { InstagramProvider, InstagramData, ScrapedPost, ScrapedReel, ScrapedProfile } from "./instagram-provider";

export class MockProvider implements InstagramProvider {
  async fetchInfluencerData(username: string): Promise<InstagramData> {
    console.log(`[MockProvider] Generating mock data for @${username}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // High quality Unsplash images for realistic UI testing
    const placeholderImages = [
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550614000-4b95d466f20b?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601288496920-b6154fe3626a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485230405346-71acb9518d9c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509631179647-0c37cb110060?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
    ];

    const profile: ScrapedProfile = {
      username: username,
      fullName: `${username.charAt(0).toUpperCase() + username.slice(1)} (Mocked)`,
      bio: "✨ Creating beautiful content daily.\n💌 For business inquiries: collab@example.com\n📱 +1 (555) 123-4567\n👇 Shop my looks below!",
      profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
      followersCount: Math.floor(Math.random() * 900000) + 100000,
      followingCount: Math.floor(Math.random() * 1000) + 100,
      postsCount: Math.floor(Math.random() * 2000) + 500,
      externalLink: "https://linktr.ee/mocked",
      publicEmail: "collab@example.com",
      publicPhoneNumber: "+1 (555) 123-4567",
    };

    const posts: ScrapedPost[] = [];
    const reels: ScrapedReel[] = [];

    // Generate 12 Feed Posts
    for (let i = 0; i < 12; i++) {
      const likesCount = Math.floor(Math.random() * 50000) + 1000;
      posts.push({
        id: `mock_post_${i}_${Date.now()}`,
        thumbnailUrl: placeholderImages[i % placeholderImages.length],
        caption: `Living my best life in the city! 🏙️✨ #fashion #lifestyle #vibe\n\nAdoring this new collection. Drop a ❤️ if you agree!`,
        likesCount,
        commentsCount: Math.floor(likesCount * 0.05), // 5% comment rate
        url: `https://www.instagram.com/p/mock_post_${i}/`,
        timestamp: new Date(Date.now() - i * 86400000 * 2), // Spaced out every 2 days
        isVideo: false,
      });
    }

    // Generate 12 Reels
    for (let i = 0; i < 12; i++) {
      const viewCount = Math.floor(Math.random() * 500000) + 10000;
      reels.push({
        id: `mock_reel_${i}_${Date.now()}`,
        thumbnailUrl: placeholderImages[(i + 5) % placeholderImages.length], // Shifted images for variety
        url: `https://www.instagram.com/reel/mock_reel_${i}/`,
        viewCount,
        likesCount: Math.floor(viewCount * 0.08), // 8% like rate
        commentsCount: Math.floor(viewCount * 0.005), // 0.5% comment rate
        timestamp: new Date(Date.now() - i * 86400000 * 3), // Spaced out every 3 days
      });
    }

    return {
      profile,
      posts,
      reels,
    };
  }
}
