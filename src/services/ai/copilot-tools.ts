import OpenAI from "openai";
import { db } from "@/lib/db";
import { OutreachGeneratorService } from "./outreach-generator.service";

export const COPILOT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_influencers",
      description: "Search and list influencers/creators with optional filters. Use for any question about creators.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "e.g. Travel, Beauty, Fashion" },
          location: { type: "string", description: "City or country, matched loosely" },
          status: {
            type: "string",
            enum: ["NEW_LEAD", "CONTACTED", "REPLIED", "NEGOTIATING", "ACTIVE", "ONBOARDED", "BLACKLISTED"],
          },
          minFollowers: { type: "number" },
          maxFollowers: { type: "number" },
          minEngagementRate: { type: "number" },
          notContactedInDays: { type: "number", description: "Set for 'not contacted in last N days' queries." },
          sortBy: {
            type: "string",
            enum: ["followers_desc", "engagementRate_desc", "createdAt_desc"],
            description: "Use engagementRate_desc for 'highest engagement' style queries.",
          },
          limit: { type: "number", description: "Max rows to return, default 10." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_campaigns",
      description: "Search and list campaigns with optional filters, including campaigns ending soon.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["PLANNING", "ACTIVE", "REVIEW", "COMPLETED", "CANCELLED"] },
          endingWithinDays: { type: "number", description: "Set for 'ending this week/soon' queries (7 for this week)." },
          clientNameContains: { type: "string" },
          minBudget: { type: "number" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "Search and list clients/brands with optional filters.",
      parameters: {
        type: "object",
        properties: {
          industry: { type: "string" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "LEAD", "CLOSED"] },
          nameContains: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "Search and list internal tasks with optional filters.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          assigneeNameContains: { type: "string" },
          overdue: { type: "boolean" },
          dueInDays: { type: "number" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_team_activity",
      description: "Get a feed of recent team activity / audit trail (what team members have been doing in the system).",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max rows, default 10." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_outreach_for_influencer",
      description: "Generate a personalized outreach draft (email + Instagram DM + WhatsApp) for a named influencer.",
      parameters: {
        type: "object",
        properties: {
          influencerName: { type: "string", description: "The influencer's display name or Instagram handle." },
          tone: {
            type: "string",
            enum: ["PROFESSIONAL", "FRIENDLY", "PREMIUM", "LUXURY", "CASUAL"],
            description: "Default to PROFESSIONAL if not specified.",
          },
          clientName: { type: "string", description: "Optional brand/client this outreach is on behalf of." },
          campaignName: { type: "string", description: "Optional campaign this outreach relates to." },
        },
        required: ["influencerName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new internal task, optionally assigned to a named team member.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          assigneeName: { type: "string", description: "Name of the team member to assign this to." },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          dueDate: { type: "string", description: "ISO 8601 date, if the user implied a deadline." },
        },
        required: ["title"],
      },
    },
  },
];

interface ToolContext {
  userId: string;
}

async function resolveUserByName(name: string) {
  const prisma = db as any;
  return prisma.user.findFirst({
    where: {
      OR: [{ name: { contains: name, mode: "insensitive" } }, { email: { contains: name, mode: "insensitive" } }],
    },
    select: { id: true, name: true, email: true },
  });
}

async function resolveInfluencerByName(name: string) {
  const prisma = db as any;
  const clean = name.replace(/^@/, "");
  return prisma.influencer.findFirst({
    where: {
      OR: [
        { influencerName: { contains: clean, mode: "insensitive" } },
        { instagramHandle: { contains: clean, mode: "insensitive" } },
      ],
    },
    select: { id: true, influencerName: true, instagramHandle: true },
  });
}

export async function executeCopilotTool(
  name: string,
  args: Record<string, any>,
  context: ToolContext
): Promise<any> {
  const prisma = db as any;

  switch (name) {
    case "list_influencers": {
      const where: any = {};
      if (args.category) where.category = { contains: args.category, mode: "insensitive" };
      if (args.location) where.location = { contains: args.location, mode: "insensitive" };
      if (args.status) where.status = args.status;
      if (args.minFollowers != null) where.followers = { gte: args.minFollowers };
      if (args.maxFollowers != null) where.followers = { ...where.followers, lte: args.maxFollowers };
      if (args.minEngagementRate != null) where.engagementRate = { gte: args.minEngagementRate };
      if (args.notContactedInDays != null) {
        const cutoff = new Date(Date.now() - args.notContactedInDays * 86_400_000);
        where.OR = [{ lastContactDate: null }, { lastContactDate: { lt: cutoff } }];
      }

      const sortMap: Record<string, any> = {
        followers_desc: { followers: "desc" },
        engagementRate_desc: { engagementRate: "desc" },
        createdAt_desc: { createdAt: "desc" },
      };

      const rows = await prisma.influencer.findMany({
        where,
        select: {
          id: true,
          influencerName: true,
          instagramHandle: true,
          category: true,
          location: true,
          followers: true,
          engagementRate: true,
          status: true,
          lastContactDate: true,
        },
        orderBy: sortMap[args.sortBy] || { followers: "desc" },
        take: Math.min(args.limit || 10, 25),
      });

      return { count: rows.length, influencers: rows };
    }

    case "list_campaigns": {
      const where: any = {};
      if (args.status) where.status = args.status;
      if (args.clientNameContains) {
        where.client = { companyName: { contains: args.clientNameContains, mode: "insensitive" } };
      }
      if (args.minBudget != null) where.budget = { gte: args.minBudget };
      if (args.endingWithinDays != null) {
        const until = new Date(Date.now() + args.endingWithinDays * 86_400_000);
        where.endDate = { gte: new Date(), lte: until };
      }

      const rows = await prisma.campaign.findMany({
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
        orderBy: { createdAt: "desc" },
        take: Math.min(args.limit || 10, 25),
      });

      return { count: rows.length, campaigns: rows };
    }

    case "list_clients": {
      const where: any = {};
      if (args.industry) where.industry = { contains: args.industry, mode: "insensitive" };
      if (args.status) where.status = args.status;
      if (args.nameContains) {
        where.OR = [
          { companyName: { contains: args.nameContains, mode: "insensitive" } },
          { brandName: { contains: args.nameContains, mode: "insensitive" } },
        ];
      }

      const rows = await prisma.client.findMany({
        where,
        select: { id: true, companyName: true, brandName: true, industry: true, status: true },
        orderBy: { createdAt: "desc" },
        take: Math.min(args.limit || 10, 25),
      });

      return { count: rows.length, clients: rows };
    }

    case "list_tasks": {
      const where: any = {};
      if (args.status) where.status = args.status;
      if (args.priority) where.priority = args.priority;
      if (args.assigneeNameContains) {
        where.assignee = { name: { contains: args.assigneeNameContains, mode: "insensitive" } };
      }
      if (args.overdue) {
        where.dueDate = { lt: new Date() };
        where.status = where.status || { not: "DONE" };
      }
      if (args.dueInDays != null) {
        const until = new Date(Date.now() + args.dueInDays * 86_400_000);
        where.dueDate = { gte: new Date(), lte: until };
      }

      const rows = await prisma.task.findMany({
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
        orderBy: { dueDate: "asc" },
        take: Math.min(args.limit || 10, 25),
      });

      return { count: rows.length, tasks: rows };
    }

    case "get_team_activity": {
      const rows = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: Math.min(args.limit || 10, 25),
      });
      return { count: rows.length, activity: rows };
    }

    case "generate_outreach_for_influencer": {
      const influencer = await resolveInfluencerByName(args.influencerName);
      if (!influencer) {
        return { error: `Could not find an influencer matching "${args.influencerName}".` };
      }

      let clientId: string | undefined;
      if (args.clientName) {
        const client = await prisma.client.findFirst({
          where: { companyName: { contains: args.clientName, mode: "insensitive" } },
          select: { id: true },
        });
        clientId = client?.id;
      }

      let campaignId: string | undefined;
      if (args.campaignName) {
        const campaign = await prisma.campaign.findFirst({
          where: { name: { contains: args.campaignName, mode: "insensitive" } },
          select: { id: true },
        });
        campaignId = campaign?.id;
      }

      const service = new OutreachGeneratorService();
      const message = await service.generate(
        {
          influencerId: influencer.id,
          clientId,
          campaignId,
          tone: args.tone || "PROFESSIONAL",
        },
        context.userId
      );

      return {
        influencer: influencer.influencerName || influencer.instagramHandle,
        subjectLine: message.subjectLine,
        emailBody: message.emailBody,
        instagramDM: message.instagramDM,
        whatsappMessage: message.whatsappMessage,
      };
    }

    case "create_task": {
      let assigneeId: string | undefined;
      let assigneeName: string | undefined;
      if (args.assigneeName) {
        const user = await resolveUserByName(args.assigneeName);
        if (!user) {
          return { error: `Could not find a team member matching "${args.assigneeName}". The task was not created.` };
        }
        assigneeId = user.id;
        assigneeName = user.name || user.email;
      }

      const task = await prisma.task.create({
        data: {
          title: args.title,
          description: args.description,
          priority: args.priority || "MEDIUM",
          status: "TODO",
          dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
          assigneeId,
          authorId: context.userId,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "TASK_CREATED_BY_AI",
          entityType: "TASK",
          entityId: task.id,
          adminId: context.userId,
          details: `Twin AI created task "${task.title}"${assigneeName ? ` assigned to ${assigneeName}` : ""}`,
        },
      });

      return {
        taskId: task.id,
        title: task.title,
        assignedTo: assigneeName || "unassigned",
        priority: task.priority,
        dueDate: task.dueDate,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
