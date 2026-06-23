import OpenAI from "openai";
import { db } from "@/lib/db";
import { brandMatchResponseSchema, BrandMatchResponse } from "@/lib/validations/brand-match";

const SYSTEM_PROMPT = `You are a senior brand-partnerships strategist at a talent agency. You evaluate how well an Instagram creator fits a specific brand campaign, for an account manager deciding whether to assign this creator.

Ground every claim strictly in the data you are given. If a data point is missing or marked "unknown", say so explicitly rather than inventing numbers. Audience demographics are not tracked here — base audience-fit judgments only on follower count, engagement, category, and bio.

Respond with ONLY a single valid JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "matchScore": integer 0-100 (overall compatibility between the creator and this campaign/client),
  "explanation": string[] (2-5 short bullet points justifying the score, e.g. "Strong beauty content history"),
  "risks": string[] (0-5 short bullet points on mismatch/risk concerns; empty array if none worth flagging),
  "recommendedDeliverables": string[] (2-6 concrete deliverables sized to the campaign budget and the creator's typical formats, e.g. "2 Reels", "3 Stories", "1 Carousel Post")
}`;

function summarizeClientHistory(campaigns: any[], excludeCampaignId: string): string {
  const prior = campaigns.filter((c) => c.id !== excludeCampaignId);
  if (prior.length === 0) {
    return "No prior campaigns on record for this client.";
  }

  return prior
    .slice(0, 5)
    .map((c) => {
      const creatorCategories = (c.influencers || [])
        .map((ci: any) => ci.influencer?.category)
        .filter(Boolean);
      const categoriesStr = creatorCategories.length
        ? ` (creator categories used: ${[...new Set(creatorCategories)].join(", ")})`
        : "";
      return `- "${c.name}" (status: ${c.status}, ${c.influencers?.length ?? 0} creators assigned)${categoriesStr}`;
    })
    .join("\n");
}

export class BrandMatchService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  /** Returns the cached match if one exists; only calls the LLM when nothing is cached yet. */
  async getOrCreateMatch(campaignId: string, influencerId: string) {
    const prisma = db as any;

    const existing = await prisma.brandMatchAnalysis.findUnique({
      where: { campaignId_influencerId: { campaignId, influencerId } },
    });

    if (existing) {
      return existing;
    }

    return this.computeMatch(campaignId, influencerId);
  }

  /** Always re-runs the LLM and overwrites the cached result. */
  async regenerateMatch(campaignId: string, influencerId: string) {
    return this.computeMatch(campaignId, influencerId);
  }

  private async computeMatch(campaignId: string, influencerId: string) {
    if (!this.client) {
      throw new Error("OPENAI_API_KEY is not set. BrandMatchService requires an OpenAI API key.");
    }

    const prisma = db as any;

    const [campaign, influencer] = await Promise.all([
      prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          client: {
            include: {
              campaigns: {
                include: {
                  influencers: {
                    include: { influencer: { select: { category: true } } },
                  },
                },
                orderBy: { createdAt: "desc" },
                take: 6,
              },
            },
          },
        },
      }),
      prisma.influencer.findUnique({
        where: { id: influencerId },
        include: {
          analytics: true,
          creatorIntelligence: true,
          recentPosts: { orderBy: { publishedDate: "desc" }, take: 12 },
          recentReels: { orderBy: { publishedDate: "desc" }, take: 12 },
        },
      }),
    ]);

    if (!campaign) throw new Error(`Campaign not found for ID: ${campaignId}`);
    if (!influencer) throw new Error(`Influencer not found for ID: ${influencerId}`);

    const userPrompt = this.buildPrompt(campaign, influencer);
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    let completion;
    try {
      completion = await this.client.chat.completions.create({
        model,
        temperature: 0.4,
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

    const validationResult = brandMatchResponseSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      throw new Error(
        `OpenAI response did not match the expected schema: ${validationResult.error.issues[0]?.message}`
      );
    }

    const validated = validationResult.data;

    return prisma.brandMatchAnalysis.upsert({
      where: { campaignId_influencerId: { campaignId, influencerId } },
      create: {
        campaignId,
        influencerId,
        ...this.toDbShape(validated),
        modelUsed: completion.model,
      },
      update: {
        ...this.toDbShape(validated),
        modelUsed: completion.model,
      },
    });
  }

  private toDbShape(v: BrandMatchResponse) {
    return {
      matchScore: v.matchScore,
      explanation: v.explanation,
      risks: v.risks,
      recommendedDeliverables: v.recommendedDeliverables,
    };
  }

  private buildPrompt(campaign: any, influencer: any): string {
    const client = campaign.client;
    const analytics = influencer.analytics;
    const ai = influencer.creatorIntelligence;

    const contentStyle = influencer.recentReels?.length > 0
      ? `Mix of posts and reels (${influencer.recentPosts?.length ?? 0} posts, ${influencer.recentReels?.length ?? 0} reels tracked)`
      : `Primarily static posts (${influencer.recentPosts?.length ?? 0} posts tracked, no reels)`;

    return `Evaluate how well this creator fits this campaign and client.

INFLUENCER
- Handle: @${influencer.instagramHandle}
- Name: ${influencer.influencerName || "unknown"}
- Category: ${influencer.category || "uncategorized"}
- Bio: ${influencer.profileDescription || "(none)"}
- Followers: ${influencer.followers ?? "unknown"}
- Engagement Rate: ${influencer.engagementRate != null ? `${influencer.engagementRate}%` : "unknown"}
- Avg Reel Views: ${analytics?.avgReelViews ?? "unknown"}
- Avg Post Likes: ${analytics?.avgPostLikes ?? "unknown"}
- Content Style: ${contentStyle}
${ai ? `- Existing AI Creator Intelligence Summary: ${ai.summary}\n- Known Strengths: ${ai.strengths?.join("; ")}\n- Known Weaknesses: ${ai.weaknesses?.join("; ")}\n- Previously Recommended Categories: ${ai.recommendedCategories?.join(", ")}\n- Brand Safety: ${ai.brandSafetyScore}` : "- No prior AI Creator Intelligence report on file for this creator."}

CAMPAIGN
- Name: ${campaign.name}
- Goals / Deliverables: ${campaign.deliverables || "(not specified)"}
- Budget: $${campaign.budget ?? 0}
- Status: ${campaign.status}
- Notes: ${campaign.notes || "(none)"}

CLIENT
- Company: ${client.companyName}${client.brandName ? ` (brand: ${client.brandName})` : ""}
- Brand Category / Industry: ${client.industry || "unknown"}
- Previous Campaigns:
${summarizeClientHistory(client.campaigns || [], campaign.id)}

Return strict JSON only, matching the schema described in the system prompt.`;
  }
}
