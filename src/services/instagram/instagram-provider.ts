export interface ScrapedProfile {
  username: string;
  fullName?: string;
  bio?: string;
  profileImageUrl?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  externalLink?: string;
  publicEmail?: string;
  publicPhoneNumber?: string;
}

export interface ScrapedPost {
  id: string;
  thumbnailUrl?: string;
  caption?: string;
  likesCount: number;
  commentsCount: number;
  url: string;
  timestamp?: Date;
  isVideo?: boolean;
  videoViewCount?: number;
}

export interface ScrapedReel {
  id: string;
  thumbnailUrl?: string;
  url: string;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  timestamp?: Date;
}

export interface InstagramData {
  profile: ScrapedProfile;
  posts: ScrapedPost[];
  reels: ScrapedReel[];
}

export interface InstagramProvider {
  /**
   * Fetch all profile, posts, and reels data for a given username.
   */
  fetchInfluencerData(username: string): Promise<InstagramData>;
}
