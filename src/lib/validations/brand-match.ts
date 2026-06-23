import * as z from "zod";

export const brandMatchResponseSchema = z.object({
  matchScore: z.coerce.number().int().min(0).max(100),
  explanation: z.array(z.string().min(1).max(200)).min(1).max(6),
  risks: z.array(z.string().min(1).max(200)).max(6).default([]),
  recommendedDeliverables: z.array(z.string().min(1).max(60)).min(1).max(8),
});

export type BrandMatchResponse = z.infer<typeof brandMatchResponseSchema>;
