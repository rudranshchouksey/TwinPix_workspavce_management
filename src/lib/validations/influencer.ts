import * as z from "zod";

export const influencerSchema = z.object({
  influencerName: z.string().optional().nullable(),
  instagramHandle: z.string().min(1, "Instagram handle is required").max(100),
  platform: z.string().optional().nullable(),
  posts: z.coerce.number().optional().nullable(),
  followers: z.coerce.number().optional().nullable(),
  following: z.coerce.number().optional().nullable(),
  category: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  phoneNumber: z.string().optional().nullable(),
  profileLink: z.string().optional().nullable(),
  sampleVideoViews: z.string().optional().nullable(),
  profileDescription: z.string().optional().nullable(),
  engagementRate: z.coerce.number().optional().nullable(),
  status: z.enum(["NEW_LEAD", "CONTACTED", "REPLIED", "NEGOTIATING", "ACTIVE", "ONBOARDED", "BLACKLISTED"]).default("NEW_LEAD"),
  notes: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable(),
  assignedManagerId: z.string().optional().nullable(),
  reelRate: z.coerce.number().optional().nullable(),
  storyRate: z.coerce.number().optional().nullable(),
  campaignCount: z.coerce.number().default(0),
  lastContactDate: z.date().optional().nullable(),
});

export type InfluencerInput = z.infer<typeof influencerSchema>;
