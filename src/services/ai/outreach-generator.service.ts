import OpenAI from "openai";
import { db } from "@/lib/db";
import {
  outreachResponseSchema,
  OutreachResponse,
  GenerateOutreachInput,
} from "@/lib/validations/outreach";

const TONE_GUIDANCE: Record<string, string> = {
  PROFESSIONAL: "Formal, business-appropriate tone. Clear value proposition, respectful and concise.",
  FRIENDLY: "Warm, conversational, approachable — like a colleague reaching out, still respectful.",
  PREMIUM: "Polished, confident, slightly elevated language conveying exclusivity without being over-the-top.",
  LUXURY: "Aspirational and opulent vocabulary, evokes exclusivity and prestige, sophisticated phrasing.",
  CASUAL: "Relaxed and informal, friendly, light emoji acceptable in the DM/WhatsApp messages only.",
};

const SYSTEM_PROMPT = `You are a senior influencer-partnerships outreach copywriter at a talent agency. You write highly personalized first-contact outreach to creators on behalf of brands, in the requested tone.

Always personalize using the specific creator/brand/campaign details given — reference their actual content niche, not generic flattery. Avoid sounding salesy or robotic. If client or campaign details are missing, write a general exploratory partnership outreach rather than inventing a campaign or client name.

Respond with ONLY a single valid JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "subjectLine": string (concise, compelling email subject line),
  "emailBody": string (full personalized email with greeting and a sign-off placeholder like "Best,\\nTwinPix Team"),
  "instagramDM": string (short personalized Instagram DM, under ~500 characters),
  "whatsappMessage": string (short personalized WhatsApp message, under ~400 characters)
}`;

export class OutreachGeneratorService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async generate(input: GenerateOutreachInput, userId?: string) {
    if (!this.client) {
      throw new Error("OPENAI_API_KEY is not set. OutreachGeneratorService requires an OpenAI API key.");
    }

    const prisma = db as any;

    const influencer = await prisma.influencer.findUnique({
      where: { id: input.influencerId },
      select: {
        id: true,
        influencerName: true,
        instagramHandle: true,
        category: true,
        profileDescription: true,
      },
    });
    if (!influencer) {
      throw new Error(`Influencer not found for ID: ${input.influencerId}`);
    }

    let campaign: any = null;
    if (input.campaignId) {
      campaign = await prisma.campaign.findUnique({
        where: { id: input.campaignId },
        select: {
          id: true,
          name: true,
          deliverables: true,
          client: { select: { id: true, companyName: true, brandName: true } },
        },
      });
    }

    let client: any = campaign?.client || null;
    if (!client && input.clientId) {
      client = await prisma.client.findUnique({
        where: { id: input.clientId },
        select: { id: true, companyName: true, brandName: true },
      });
    }

    const userPrompt = this.buildPrompt(influencer, client, campaign, input.tone);
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    let completion;
    try {
      completion = await this.client.chat.completions.create({
        model,
        temperature: 0.7,
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
    if (!raw) {
      throw new Error("OpenAI returned an empty response.");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      throw new Error("OpenAI response was not valid JSON.");
    }

    const validationResult = outreachResponseSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      throw new Error(
        `OpenAI response did not match the expected schema: ${validationResult.error.issues[0]?.message}`
      );
    }

    const validated = validationResult.data;

    return prisma.outreachMessage.create({
      data: {
        influencerId: input.influencerId,
        clientId: client?.id,
        campaignId: campaign?.id,
        createdById: userId,
        tone: input.tone,
        ...this.toDbShape(validated),
        modelUsed: completion.model,
      },
    });
  }

  private toDbShape(v: OutreachResponse) {
    return {
      subjectLine: v.subjectLine,
      emailBody: v.emailBody,
      instagramDM: v.instagramDM,
      whatsappMessage: v.whatsappMessage,
    };
  }

  private buildPrompt(influencer: any, client: any, campaign: any, tone: string): string {
    return `Write personalized outreach for the following creator.

INFLUENCER
- Name: ${influencer.influencerName || influencer.instagramHandle}
- Handle: @${influencer.instagramHandle}
- Category: ${influencer.category || "uncategorized"}
- Bio: ${influencer.profileDescription || "(none)"}

BRAND / CLIENT
${client ? `- Company: ${client.companyName}${client.brandName ? ` (brand: ${client.brandName})` : ""}` : "- No specific client selected — write a general partnership outreach without naming a brand."}

CAMPAIGN
${campaign ? `- Name: ${campaign.name}\n- Deliverables: ${campaign.deliverables || "(not specified)"}` : "- No specific campaign selected — keep the message exploratory, inviting a conversation about potential collaboration."}

TONE: ${tone} — ${TONE_GUIDANCE[tone] || TONE_GUIDANCE.PROFESSIONAL}

Write the outreach now, returning strict JSON only matching the schema described in the system prompt.`;
  }
}
