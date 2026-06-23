import OpenAI from "openai";
import { db } from "@/lib/db";
import {
  creatorAIInsightsResponseSchema,
  CreatorAIInsightsResponse,
} from "@/lib/validations/creator-intelligence";

const SYSTEM_PROMPT = `You are a senior influencer marketing strategist at a talent agency. You analyze creator profiles and produce a brand-partnership intelligence report for internal account managers deciding whether to pitch this creator to brands.

Ground every claim strictly in the data you are given. If a data point is missing or marked "unknown", say so explicitly rather than inventing numbers.

Respond with ONLY a single valid JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "summary": string (2-4 sentences, what kind of creator this is and what they're best suited for),
  "strengths": string[] (3-6 short bullet points),
  "weaknesses": string[] (2-5 short bullet points),
  "recommendedCategories": string[] (3-6 brand/industry categories, e.g. "Travel", "Beauty"),
  "brandSafetyScore": "LOW" | "MEDIUM" | "HIGH" (risk level — LOW means low risk/safe, HIGH means high risk),
  "brandSafetyReason": string (1-3 sentences explaining the brand safety rating),
  "collaborationRecommendation": "STRONGLY_RECOMMEND" | "RECOMMEND" | "NEUTRAL" | "NOT_RECOMMENDED",
  "intelligenceScore": integer 0-100 (overall creator quality score, weighing engagement, consistency, audience quality, campaign track record, and content diversity)
}`;

function computePostingFrequency(posts: { publishedDate: Date | string }[]): string {
  if (!posts || posts.length < 2) {
    return "Not enough recent post data to determine posting frequency.";
  }

  const sorted = [...posts].sort(
    (a, b) => +new Date(b.publishedDate) - +new Date(a.publishedDate)
  );
  const spanDays =
    (+new Date(sorted[0].publishedDate) - +new Date(sorted[sorted.length - 1].publishedDate)) /
    86_400_000;

  if (spanDays <= 0) {
    return "Not enough recent post data to determine posting frequency.";
  }

  const perWeek = (sorted.length / spanDays) * 7;
  return `~${perWeek.toFixed(1)} posts/week (based on the last ${sorted.length} tracked posts spanning ${Math.round(spanDays)} days)`;
}

function summarizeCampaignHistory(campaigns: any[]): string {
  if (!campaigns || campaigns.length === 0) {
    return "No prior campaign history on record.";
  }

  return campaigns
    .slice(0, 10)
    .map((c) => {
      const name = c.campaign?.name || "Unnamed campaign";
      const status = c.campaign?.status || "UNKNOWN";
      const deliverableStatus = c.status || "UNKNOWN";
      return `- "${name}" (campaign status: ${status}, deliverable status: ${deliverableStatus}, fee: $${c.fee ?? 0})`;
    })
    .join("\n");
}

export class CreatorIntelligenceService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async generateInsights(influencerId: string) {
    if (!this.client) {
      throw new Error(
        "OPENAI_API_KEY is not set. CreatorIntelligenceService requires an OpenAI API key."
      );
    }

    const prisma = db as any;

    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        analytics: true,
        recentPosts: { orderBy: { publishedDate: "desc" }, take: 12 },
        recentReels: { orderBy: { publishedDate: "desc" }, take: 12 },
        campaigns: { include: { campaign: true } },
      },
    });

    if (!influencer) {
      throw new Error(`Influencer not found for ID: ${influencerId}`);
    }

    const userPrompt = this.buildPrompt(influencer);
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

    const validationResult = creatorAIInsightsResponseSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      throw new Error(
        `OpenAI response did not match the expected schema: ${validationResult.error.issues[0]?.message}`
      );
    }

    const validated = validationResult.data;

    const saved = await prisma.creatorAIInsights.upsert({
      where: { influencerId },
      create: {
        influencerId,
        ...this.toDbShape(validated),
        modelUsed: completion.model,
      },
      update: {
        ...this.toDbShape(validated),
        modelUsed: completion.model,
      },
    });

    return saved;
  }

  private toDbShape(v: CreatorAIInsightsResponse) {
    return {
      summary: v.summary,
      strengths: v.strengths,
      weaknesses: v.weaknesses,
      recommendedCategories: v.recommendedCategories,
      brandSafetyScore: v.brandSafetyScore,
      brandSafetyReason: v.brandSafetyReason,
      collaborationRecommendation: v.collaborationRecommendation,
      intelligenceScore: v.intelligenceScore,
    };
  }

  private buildPrompt(influencer: any): string {
    const analytics = influencer.analytics;

    return `Analyze this Instagram creator profile and produce a brand-partnership intelligence report.

PROFILE
- Handle: @${influencer.instagramHandle}
- Name: ${influencer.influencerName || "unknown"}
- Category: ${influencer.category || "uncategorized"}
- Bio: ${influencer.profileDescription || "(none)"}
- Followers: ${influencer.followers ?? "unknown"}
- Following: ${influencer.following ?? "unknown"}
- Total Posts (lifetime): ${influencer.posts ?? "unknown"}
- Overall Engagement Rate: ${influencer.engagementRate != null ? `${influencer.engagementRate}%` : "unknown"}

CONTENT ANALYTICS (recent tracked window)
- Avg Engagement Rate: ${analytics?.avgEngagementRate != null ? `${analytics.avgEngagementRate}%` : "unknown"}
- Avg Reel Views: ${analytics?.avgReelViews ?? "unknown"}
- Avg Post Likes: ${analytics?.avgPostLikes ?? "unknown"}
- Avg Post Comments: ${analytics?.avgPostComments ?? "unknown"}
- Posting Frequency: ${computePostingFrequency(influencer.recentPosts || [])}
- Posts Tracked: ${influencer.recentPosts?.length ?? 0}
- Reels Tracked: ${influencer.recentReels?.length ?? 0}

CAMPAIGN HISTORY
${summarizeCampaignHistory(influencer.campaigns || [])}

Return strict JSON only, matching the schema described in the system prompt.`;
  }
}
