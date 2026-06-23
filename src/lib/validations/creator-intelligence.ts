import * as z from "zod";

export const BRAND_SAFETY_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export const COLLABORATION_RECOMMENDATIONS = [
  "STRONGLY_RECOMMEND",
  "RECOMMEND",
  "NEUTRAL",
  "NOT_RECOMMENDED",
] as const;

export const creatorAIInsightsResponseSchema = z.object({
  summary: z.string().min(1).max(800),
  strengths: z.array(z.string().min(1).max(160)).min(1).max(6),
  weaknesses: z.array(z.string().min(1).max(160)).min(1).max(6),
  recommendedCategories: z.array(z.string().min(1).max(40)).min(1).max(8),
  brandSafetyScore: z.enum(BRAND_SAFETY_LEVELS),
  brandSafetyReason: z.string().min(1).max(500),
  collaborationRecommendation: z.enum(COLLABORATION_RECOMMENDATIONS),
  intelligenceScore: z.coerce.number().int().min(0).max(100),
});

export type CreatorAIInsightsResponse = z.infer<typeof creatorAIInsightsResponseSchema>;
