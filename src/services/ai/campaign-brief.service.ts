import OpenAI from "openai";
import { z } from "zod";
import { db } from "@/lib/db";

const briefResponseSchema = z.object({
  objective: z.string(),
  targetAudience: z.string(),
  recommendedInfluencerProfile: z.string(),
  suggestedDeliverables: z.array(z.string()).min(1),
  suggestedBudgetRange: z.object({ min: z.number(), max: z.number() }),
  recommendedTimelineWeeks: z.number(),
  summary: z.string(),
});

export type CampaignBriefResponse = z.infer<typeof briefResponseSchema>;

export interface GenerateCampaignBriefInput {
  campaignId?: string;
  campaignName?: string;
  clientId?: string;
  objective?: string;
  targetCategory?: string;
  budget?: number;
}

const SYSTEM_PROMPT = `You are a senior influencer-marketing strategist at a talent agency. You write sharp, actionable campaign briefs for the internal team to execute against.

Respond with ONLY a single valid JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "objective": string (1-2 sentence campaign objective),
  "targetAudience": string (description of the target audience),
  "recommendedInfluencerProfile": string (creator category/size/engagement profile to look for),
  "suggestedDeliverables": string[] (3-6 concrete deliverable items, e.g. "2 Instagram Reels per creator"),
  "suggestedBudgetRange": { "min": number, "max": number } (USD, realistic for the scope described),
  "recommendedTimelineWeeks": number (realistic campaign duration in weeks),
  "summary": string (2-3 sentence executive summary of the recommended approach)
}`;

export class CampaignBriefService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async generate(input: GenerateCampaignBriefInput): Promise<CampaignBriefResponse> {
    if (!this.client) {
      throw new Error("OPENAI_API_KEY is not set. CampaignBriefService requires an OpenAI API key.");
    }

    const prisma = db as any;

    let campaign: any = null;
    if (input.campaignId) {
      campaign = await prisma.campaign.findUnique({
        where: { id: input.campaignId },
        select: {
          name: true,
          budget: true,
          deliverables: true,
          startDate: true,
          endDate: true,
          client: { select: { companyName: true, brandName: true, industry: true } },
          influencers: {
            select: { influencer: { select: { category: true, followers: true } } },
          },
        },
      });
    }

    let client: any = campaign?.client || null;
    if (!client && input.clientId) {
      client = await prisma.client.findUnique({
        where: { id: input.clientId },
        select: { companyName: true, brandName: true, industry: true },
      });
    }

    const userPrompt = this.buildPrompt(input, campaign, client);
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    let completion;
    try {
      completion = await this.client.chat.completions.create({
        model,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      });
    } catch (error: any) {
      throw new Error(`OpenAI request failed: ${error.message}`);
    }

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI returned an empty response.");

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      throw new Error("OpenAI response was not valid JSON.");
    }

    const result = briefResponseSchema.safeParse(parsedJson);
    if (!result.success) {
      throw new Error(`OpenAI response did not match the expected schema: ${result.error.issues[0]?.message}`);
    }

    return result.data;
  }

  private buildPrompt(input: GenerateCampaignBriefInput, campaign: any, client: any): string {
    if (campaign) {
      const categories = Array.from(
        new Set(campaign.influencers.map((i: any) => i.influencer.category).filter(Boolean))
      );
      return `Write a campaign brief for this EXISTING campaign.

CAMPAIGN
- Name: ${campaign.name}
- Budget: $${campaign.budget}
- Current deliverables note: ${campaign.deliverables || "(none specified)"}
- Dates: ${campaign.startDate ? new Date(campaign.startDate).toDateString() : "TBD"} - ${campaign.endDate ? new Date(campaign.endDate).toDateString() : "TBD"}
- Currently assigned influencer categories: ${categories.join(", ") || "(none assigned yet)"}

CLIENT
${client ? `- ${client.companyName}${client.brandName ? ` (brand: ${client.brandName})` : ""}${client.industry ? `, industry: ${client.industry}` : ""}` : "- Not specified"}

Write the brief now, returning strict JSON only matching the schema described in the system prompt.`;
    }

    return `Write a campaign brief for a NEW campaign concept.

- Proposed campaign name: ${input.campaignName || "(not yet named)"}
- Client: ${client ? `${client.companyName}${client.brandName ? ` (brand: ${client.brandName})` : ""}${client.industry ? `, industry: ${client.industry}` : ""}` : "(not yet selected)"}
- Stated objective: ${input.objective || "(not specified — infer a sensible objective)"}
- Target creator category: ${input.targetCategory || "(not specified — recommend one)"}
- Indicative budget: ${input.budget ? `$${input.budget}` : "(not specified — recommend a realistic range)"}

Write the brief now, returning strict JSON only matching the schema described in the system prompt.`;
  }
}
