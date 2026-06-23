import OpenAI from "openai";
import { db } from "@/lib/db";
import { parsedSearchQuerySchema, ParsedSearchQuery, SearchEntity } from "@/lib/validations/smart-search";

const SEARCH_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "parse_search_query",
    description:
      "Parse a natural-language CRM search query into a structured database filter for one entity type.",
    parameters: {
      type: "object",
      properties: {
        entity: {
          type: "string",
          enum: ["INFLUENCER", "CAMPAIGN", "CLIENT", "TASK"],
          description: "Which entity the query is searching for.",
        },
        explanation: {
          type: "string",
          description: "One short sentence explaining how the query was interpreted.",
        },
        suggestedFilters: {
          type: "array",
          items: { type: "string" },
          description:
            "Human-readable filter chips summarizing the extracted filters, e.g. 'Category: Travel', 'Location: India', 'Followers > 10,000'.",
        },
        sortBy: {
          type: "string",
          description:
            "How results should be ranked, e.g. followers_desc, engagementRate_desc, createdAt_desc, budget_desc, dueDate_asc.",
        },
        influencerFilters: {
          type: "object",
          description: "Only set when entity is INFLUENCER.",
          properties: {
            category: { type: "string" },
            location: { type: "string" },
            status: {
              type: "string",
              enum: ["NEW_LEAD", "CONTACTED", "REPLIED", "NEGOTIATING", "ACTIVE", "ONBOARDED", "BLACKLISTED"],
            },
            minFollowers: { type: "number" },
            maxFollowers: { type: "number" },
            minEngagementRate: { type: "number" },
            maxEngagementRate: { type: "number" },
            notContactedInDays: {
              type: "number",
              description: "Set when the query says 'not contacted in last N days'.",
            },
          },
        },
        campaignFilters: {
          type: "object",
          description: "Only set when entity is CAMPAIGN.",
          properties: {
            status: { type: "string", enum: ["PLANNING", "ACTIVE", "REVIEW", "COMPLETED", "CANCELLED"] },
            nameContains: { type: "string" },
            clientNameContains: { type: "string" },
            minBudget: { type: "number" },
            maxBudget: { type: "number" },
          },
        },
        clientFilters: {
          type: "object",
          description: "Only set when entity is CLIENT.",
          properties: {
            industry: { type: "string" },
            status: { type: "string", enum: ["ACTIVE", "INACTIVE", "LEAD", "CLOSED"] },
            nameContains: { type: "string" },
          },
        },
        taskFilters: {
          type: "object",
          description: "Only set when entity is TASK.",
          properties: {
            status: { type: "string", enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
            overdue: { type: "boolean" },
            dueInDays: { type: "number" },
            titleContains: { type: "string" },
          },
        },
      },
      required: ["entity", "explanation", "suggestedFilters"],
    },
  },
};

const SYSTEM_PROMPT = `You are a search query parser for an influencer-marketing agency CRM. Given a natural language query, decide which single entity type it is searching for (INFLUENCER, CAMPAIGN, CLIENT, or TASK) and extract structured filters by calling the parse_search_query tool. Always call the tool — never reply in plain text.

Guidelines:
- "Influencers"/"creators" → INFLUENCER. "Campaigns" → CAMPAIGN. "Clients"/"brands" (as the agency's customer) → CLIENT. "Tasks"/"to-dos" → TASK.
- A query like "Beauty creators suitable for Nykaa campaign" is about INFLUENCERS with category Beauty — mention the brand name in the explanation but do not invent a campaign filter for it.
- Only fill in the filters object that matches the chosen entity; leave the others unset.
- Relative phrases like "not contacted in last 30 days" map to notContactedInDays; "overdue" maps to overdue:true; "due this week" maps to dueInDays:7.
- Always include 1-5 short, human-readable suggestedFilters chips summarizing what you extracted.`;

const CACHE_FRESHNESS_MS = 6 * 60 * 60 * 1000; // 6 hours

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface SmartSearchResult {
  entity: SearchEntity;
  explanation: string;
  suggestedFilters: string[];
  sortBy?: string;
  results: any[];
  fromCache: boolean;
}

export class SmartSearchService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async search(query: string): Promise<SmartSearchResult> {
    const { parsed, fromCache } = await this.getCachedOrParse(query);
    const results = await this.executeQuery(parsed);

    return {
      entity: parsed.entity,
      explanation: parsed.explanation,
      suggestedFilters: parsed.suggestedFilters,
      sortBy: parsed.sortBy,
      results,
      fromCache,
    };
  }

  private async getCachedOrParse(
    query: string
  ): Promise<{ parsed: ParsedSearchQuery; fromCache: boolean }> {
    const prisma = db as any;
    const normalizedQuery = normalizeQuery(query);

    const cached = await prisma.searchQueryCache.findUnique({ where: { normalizedQuery } });
    const isFresh = cached && Date.now() - new Date(cached.lastUsedAt).getTime() < CACHE_FRESHNESS_MS;

    if (cached && isFresh) {
      await prisma.searchQueryCache.update({
        where: { normalizedQuery },
        data: { hitCount: { increment: 1 }, lastUsedAt: new Date() },
      });

      return {
        parsed: {
          entity: cached.entity,
          explanation: cached.explanation,
          suggestedFilters: cached.suggestedFilters,
          sortBy: cached.sortBy || undefined,
          ...(cached.parsedFilters as object),
        } as ParsedSearchQuery,
        fromCache: true,
      };
    }

    const parsed = await this.parseQuery(query);

    const { entity, explanation, suggestedFilters, sortBy, ...filterFields } = parsed;
    await prisma.searchQueryCache.upsert({
      where: { normalizedQuery },
      create: {
        normalizedQuery,
        entity,
        explanation,
        suggestedFilters,
        sortBy,
        parsedFilters: filterFields,
        modelUsed: process.env.OPENAI_MODEL || "gpt-4o-mini",
      },
      update: {
        entity,
        explanation,
        suggestedFilters,
        sortBy,
        parsedFilters: filterFields,
        hitCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return { parsed, fromCache: false };
  }

  private async parseQuery(query: string): Promise<ParsedSearchQuery> {
    if (!this.client) {
      throw new Error("OPENAI_API_KEY is not set. SmartSearchService requires an OpenAI API key.");
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    let completion;
    try {
      completion = await this.client.chat.completions.create({
        model,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query },
        ],
        tools: [SEARCH_TOOL],
        tool_choice: { type: "function", function: { name: "parse_search_query" } },
      });
    } catch (error: any) {
      throw new Error(`OpenAI request failed: ${error.message}`);
    }

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function") {
      throw new Error("OpenAI did not return a tool call.");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("OpenAI tool call arguments were not valid JSON.");
    }

    const validationResult = parsedSearchQuerySchema.safeParse(parsedJson);
    if (!validationResult.success) {
      throw new Error(
        `OpenAI tool call did not match the expected schema: ${validationResult.error.issues[0]?.message}`
      );
    }

    return validationResult.data;
  }

  private async executeQuery(parsed: ParsedSearchQuery): Promise<any[]> {
    const prisma = db as any;

    switch (parsed.entity) {
      case "INFLUENCER":
        return this.queryInfluencers(prisma, parsed);
      case "CAMPAIGN":
        return this.queryCampaigns(prisma, parsed);
      case "CLIENT":
        return this.queryClients(prisma, parsed);
      case "TASK":
        return this.queryTasks(prisma, parsed);
      default:
        return [];
    }
  }

  private async queryInfluencers(prisma: any, parsed: ParsedSearchQuery) {
    const f = parsed.influencerFilters || {};
    const where: any = {};

    if (f.category) where.category = { contains: f.category, mode: "insensitive" };
    if (f.location) where.location = { contains: f.location, mode: "insensitive" };
    if (f.status) where.status = f.status;

    if (f.minFollowers != null || f.maxFollowers != null) {
      where.followers = {};
      if (f.minFollowers != null) where.followers.gte = f.minFollowers;
      if (f.maxFollowers != null) where.followers.lte = f.maxFollowers;
    }

    if (f.minEngagementRate != null || f.maxEngagementRate != null) {
      where.engagementRate = {};
      if (f.minEngagementRate != null) where.engagementRate.gte = f.minEngagementRate;
      if (f.maxEngagementRate != null) where.engagementRate.lte = f.maxEngagementRate;
    }

    if (f.notContactedInDays != null) {
      const cutoff = new Date(Date.now() - f.notContactedInDays * 86_400_000);
      where.OR = [{ lastContactDate: null }, { lastContactDate: { lt: cutoff } }];
    }

    const allowedSort: Record<string, any> = {
      followers_desc: { followers: "desc" },
      followers_asc: { followers: "asc" },
      engagementRate_desc: { engagementRate: "desc" },
      engagementRate_asc: { engagementRate: "asc" },
      createdAt_desc: { createdAt: "desc" },
      lastContactDate_asc: { lastContactDate: "asc" },
    };
    const orderBy = allowedSort[parsed.sortBy || ""] || { followers: "desc" };

    return prisma.influencer.findMany({
      where,
      select: {
        id: true,
        influencerName: true,
        instagramHandle: true,
        profileImage: true,
        category: true,
        location: true,
        followers: true,
        engagementRate: true,
        status: true,
        lastContactDate: true,
      },
      orderBy,
      take: 20,
    });
  }

  private async queryCampaigns(prisma: any, parsed: ParsedSearchQuery) {
    const f = parsed.campaignFilters || {};
    const where: any = {};

    if (f.status) where.status = f.status;
    if (f.nameContains) where.name = { contains: f.nameContains, mode: "insensitive" };
    if (f.clientNameContains) {
      where.client = { companyName: { contains: f.clientNameContains, mode: "insensitive" } };
    }
    if (f.minBudget != null || f.maxBudget != null) {
      where.budget = {};
      if (f.minBudget != null) where.budget.gte = f.minBudget;
      if (f.maxBudget != null) where.budget.lte = f.maxBudget;
    }

    const allowedSort: Record<string, any> = {
      budget_desc: { budget: "desc" },
      budget_asc: { budget: "asc" },
      createdAt_desc: { createdAt: "desc" },
      startDate_desc: { startDate: "desc" },
    };
    const orderBy = allowedSort[parsed.sortBy || ""] || { createdAt: "desc" };

    return prisma.campaign.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        budget: true,
        startDate: true,
        endDate: true,
        client: { select: { companyName: true } },
      },
      orderBy,
      take: 20,
    });
  }

  private async queryClients(prisma: any, parsed: ParsedSearchQuery) {
    const f = parsed.clientFilters || {};
    const where: any = {};

    if (f.industry) where.industry = { contains: f.industry, mode: "insensitive" };
    if (f.status) where.status = f.status;
    if (f.nameContains) {
      where.OR = [
        { companyName: { contains: f.nameContains, mode: "insensitive" } },
        { brandName: { contains: f.nameContains, mode: "insensitive" } },
      ];
    }

    const allowedSort: Record<string, any> = {
      createdAt_desc: { createdAt: "desc" },
      companyName_asc: { companyName: "asc" },
    };
    const orderBy = allowedSort[parsed.sortBy || ""] || { createdAt: "desc" };

    return prisma.client.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        brandName: true,
        industry: true,
        status: true,
        contactPerson: true,
      },
      orderBy,
      take: 20,
    });
  }

  private async queryTasks(prisma: any, parsed: ParsedSearchQuery) {
    const f = parsed.taskFilters || {};
    const where: any = {};

    if (f.status) where.status = f.status;
    if (f.priority) where.priority = f.priority;
    if (f.titleContains) where.title = { contains: f.titleContains, mode: "insensitive" };

    if (f.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = where.status || { not: "DONE" };
    }

    if (f.dueInDays != null) {
      const until = new Date(Date.now() + f.dueInDays * 86_400_000);
      where.dueDate = { gte: new Date(), lte: until };
    }

    const allowedSort: Record<string, any> = {
      dueDate_asc: { dueDate: "asc" },
      dueDate_desc: { dueDate: "desc" },
      createdAt_desc: { createdAt: "desc" },
      priority_desc: { priority: "desc" },
    };
    const orderBy = allowedSort[parsed.sortBy || ""] || { dueDate: "asc" };

    return prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: { select: { name: true } },
        campaign: { select: { name: true } },
      },
      orderBy,
      take: 20,
    });
  }
}
