import * as z from "zod";

export const OUTREACH_TONES = ["PROFESSIONAL", "FRIENDLY", "PREMIUM", "LUXURY", "CASUAL"] as const;
export type OutreachTone = (typeof OUTREACH_TONES)[number];

export const OUTREACH_TONE_LABELS: Record<OutreachTone, string> = {
  PROFESSIONAL: "Professional",
  FRIENDLY: "Friendly",
  PREMIUM: "Premium",
  LUXURY: "Luxury",
  CASUAL: "Casual",
};

export const generateOutreachInputSchema = z.object({
  influencerId: z.string().min(1),
  clientId: z.string().min(1).optional(),
  campaignId: z.string().min(1).optional(),
  tone: z.enum(OUTREACH_TONES).default("PROFESSIONAL"),
});

export type GenerateOutreachInput = z.infer<typeof generateOutreachInputSchema>;

export const outreachResponseSchema = z.object({
  subjectLine: z.string().min(1).max(150),
  emailBody: z.string().min(1).max(3000),
  instagramDM: z.string().min(1).max(1000),
  whatsappMessage: z.string().min(1).max(1000),
});

export type OutreachResponse = z.infer<typeof outreachResponseSchema>;
