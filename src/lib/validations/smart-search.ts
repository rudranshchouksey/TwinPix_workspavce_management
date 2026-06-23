import * as z from "zod";

export const SEARCH_ENTITIES = ["INFLUENCER", "CAMPAIGN", "CLIENT", "TASK"] as const;
export type SearchEntity = (typeof SEARCH_ENTITIES)[number];

const influencerFiltersSchema = z
  .object({
    category: z.string().optional(),
    location: z.string().optional(),
    status: z
      .enum(["NEW_LEAD", "CONTACTED", "REPLIED", "NEGOTIATING", "ACTIVE", "ONBOARDED", "BLACKLISTED"])
      .optional(),
    minFollowers: z.number().optional(),
    maxFollowers: z.number().optional(),
    minEngagementRate: z.number().optional(),
    maxEngagementRate: z.number().optional(),
    notContactedInDays: z.number().optional(),
  })
  .partial();

const campaignFiltersSchema = z
  .object({
    status: z.enum(["PLANNING", "ACTIVE", "REVIEW", "COMPLETED", "CANCELLED"]).optional(),
    nameContains: z.string().optional(),
    clientNameContains: z.string().optional(),
    minBudget: z.number().optional(),
    maxBudget: z.number().optional(),
  })
  .partial();

const clientFiltersSchema = z
  .object({
    industry: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "LEAD", "CLOSED"]).optional(),
    nameContains: z.string().optional(),
  })
  .partial();

const taskFiltersSchema = z
  .object({
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    overdue: z.boolean().optional(),
    dueInDays: z.number().optional(),
    titleContains: z.string().optional(),
  })
  .partial();

export const parsedSearchQuerySchema = z.object({
  entity: z.enum(SEARCH_ENTITIES),
  explanation: z.string().min(1).max(300),
  suggestedFilters: z.array(z.string().min(1).max(60)).max(8).default([]),
  sortBy: z.string().optional(),
  influencerFilters: influencerFiltersSchema.optional(),
  campaignFilters: campaignFiltersSchema.optional(),
  clientFilters: clientFiltersSchema.optional(),
  taskFilters: taskFiltersSchema.optional(),
});

export type ParsedSearchQuery = z.infer<typeof parsedSearchQuerySchema>;
export type InfluencerFilters = z.infer<typeof influencerFiltersSchema>;
export type CampaignFilters = z.infer<typeof campaignFiltersSchema>;
export type ClientFilters = z.infer<typeof clientFiltersSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
