import OpenAI from "openai";
import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// System Prompts
// ─────────────────────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are an enterprise project management AI assistant for a talent management agency (TwinPix Studio). You analyze REAL project data and generate actionable insights.

CRITICAL RULES:
- ONLY use the data provided. NEVER invent numbers, names, or statistics.
- If data is insufficient, say "Insufficient data" rather than guessing.
- Be precise with numbers — cite exact counts from the data.
- Be direct and professional. No fluff.

Respond with ONLY a single valid JSON object (no markdown fences) matching this exact shape:
{
  "healthScore": integer 0-100,
  "healthScoreReason": string (1-2 sentences explaining the score),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "risks": string[] (0-5 specific risk items based on data),
  "budgetForecast": string (1-2 sentences on budget status and projection),
  "deadlinePrediction": string (1-2 sentences on whether deadlines will be met),
  "teamWorkload": { "userId": string, "userName": string, "taskCount": integer, "overdueTasks": integer, "assessment": string }[] (max 10),
  "influencerPerformance": string (2-3 sentences summarizing influencer metrics),
  "campaignProgress": { "campaignName": string, "completionPercent": integer, "status": string, "summary": string }[],
  "blockedTasks": { "taskTitle": string, "reason": string, "assignee": string }[] (tasks that appear stuck),
  "missingDeliverables": { "influencerName": string, "campaignName": string, "status": string }[],
  "executiveSummary": string (3-5 sentence executive summary of the entire project),
  "suggestedActions": string[] (3-7 concrete next actions the team should take)
}`;

const WEEKLY_REPORT_PROMPT = `You are an enterprise project management AI. Generate a professional WEEKLY EXECUTIVE REPORT in clean Markdown format. Use headers, bullet points, and bold text for readability.

CRITICAL: Only use the data provided. Never invent statistics.

The report should have these sections:
# Weekly Executive Report — [Project Name]
## Overview
## Key Metrics
## Risks & Blockers
## Campaign Progress
## Team Performance
## Influencer Activity
## Recommended Actions
## Outlook

Keep it concise but thorough. This report will be read by executives.`;

const RISK_ANALYSIS_PROMPT = `You are a risk analysis AI for project management. Analyze the provided project data and identify ALL potential risks.

Respond with ONLY valid JSON (no markdown):
{
  "overallRiskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "risks": [
    {
      "title": string,
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "category": "DEADLINE" | "BUDGET" | "RESOURCE" | "QUALITY" | "SCOPE",
      "description": string,
      "impact": string,
      "mitigation": string
    }
  ]
}`;

const ACTIONS_PROMPT = `You are a project management AI. Based on the data, suggest concrete follow-up tasks the team should create.

Respond with ONLY valid JSON (no markdown):
{
  "actions": [
    {
      "title": string,
      "description": string,
      "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      "assignTo": string (suggest a team member name from the data, or "Team Lead"),
      "dueInDays": integer (suggested days from now)
    }
  ]
}`;

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

export class ProjectAssistantService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  private ensureClient(): OpenAI {
    if (!this.client) {
      throw new Error("OPENAI_API_KEY is not set. AI Project Assistant requires an OpenAI API key.");
    }
    return this.client;
  }

  // ── Data Fetching ───────────────────────────────────────────

  async fetchProjectSnapshot(projectId: string) {
    const now = new Date();

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        campaigns: {
          include: {
            influencers: { include: { influencer: true } },
            tasks: { select: { status: true } },
            activities: true,
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } },
            author: { select: { id: true, name: true } },
            comments: { select: { id: true } },
          },
        },
        files: { select: { id: true, fileName: true, createdAt: true } },
        events: { select: { id: true, title: true, start: true, type: true } },
      },
    });

    if (!project) throw new Error("Project not found");

    // Compute structured snapshot
    const tasks = project.tasks || [];
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === "DONE").length;
    const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;
    const reviewTasks = tasks.filter(t => t.status === "REVIEW").length;
    const todoTasks = tasks.filter(t => t.status === "TODO").length;
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE");

    // Team workload
    const workloadMap = new Map<string, { name: string; total: number; overdue: number }>();
    tasks.forEach(t => {
      if (t.assignee) {
        const key = t.assignee.id;
        const existing = workloadMap.get(key) || { name: t.assignee.name || "Unknown", total: 0, overdue: 0 };
        existing.total++;
        if (t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE") existing.overdue++;
        workloadMap.set(key, existing);
      }
    });

    const teamWorkload = Array.from(workloadMap.entries()).map(([id, data]) => ({
      userId: id,
      userName: data.name,
      taskCount: data.total,
      overdueTasks: data.overdue,
    }));

    // Campaign progress
    const campaigns = (project.campaigns || []).map(c => {
      const cTasks = c.tasks || [];
      const cTotal = cTasks.length;
      const cDone = cTasks.filter(t => t.status === "DONE").length;
      return {
        name: c.name,
        status: c.status,
        budget: c.budget,
        totalTasks: cTotal,
        completedTasks: cDone,
        completionPercent: cTotal > 0 ? Math.round((cDone / cTotal) * 100) : 0,
        influencerCount: c.influencers?.length || 0,
        influencers: (c.influencers || []).map(ci => ({
          name: ci.influencer?.influencerName || ci.influencer?.instagramHandle || "Unknown",
          fee: ci.fee,
          status: ci.status,
        })),
        startDate: c.startDate,
        endDate: c.endDate,
        totalBudget: c.budget,
        totalInfluencerFees: (c.influencers || []).reduce((sum, ci) => sum + (ci.fee || 0), 0),
      };
    });

    // Missing deliverables
    const missingDeliverables = campaigns.flatMap(c =>
      c.influencers
        .filter(i => i.status === "PENDING" || i.status === "IN_PROGRESS")
        .map(i => ({ influencerName: i.name, campaignName: c.name, status: i.status }))
    );

    // Budget
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.totalBudget || 0), 0);
    const totalInfluencerFees = campaigns.reduce((sum, c) => sum + c.totalInfluencerFees, 0);

    return {
      projectName: project.name,
      projectStatus: project.status,
      clientName: project.client?.companyName || "No client",
      description: project.description || "",
      totalTasks,
      doneTasks,
      inProgressTasks,
      reviewTasks,
      todoTasks,
      overdueTasks: overdueTasks.map(t => ({
        title: t.title,
        assignee: t.assignee?.name || "Unassigned",
        dueDate: t.dueDate?.toISOString(),
      })),
      overdueCount: overdueTasks.length,
      completionPercent: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      teamWorkload,
      campaigns,
      missingDeliverables,
      totalBudget,
      totalInfluencerFees,
      budgetUtilizationPercent: totalBudget > 0 ? Math.round((totalInfluencerFees / totalBudget) * 100) : 0,
      filesCount: project.files?.length || 0,
      upcomingEvents: (project.events || [])
        .filter(e => new Date(e.start) >= now)
        .slice(0, 5)
        .map(e => ({ title: e.title, date: e.start.toISOString(), type: e.type })),
    };
  }

  // ── AI Methods ──────────────────────────────────────────────

  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const client = this.ensureClient();
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI returned an empty response.");
    return raw;
  }

  private async callOpenAIText(systemPrompt: string, userPrompt: string): Promise<string> {
    const client = this.ensureClient();
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI returned an empty response.");
    return raw;
  }

  async analyzeProject(projectId: string) {
    const snapshot = await this.fetchProjectSnapshot(projectId);
    const userPrompt = `Analyze the following project data:\n\n${JSON.stringify(snapshot, null, 2)}`;

    const raw = await this.callOpenAI(ANALYSIS_SYSTEM_PROMPT, userPrompt);

    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("AI response was not valid JSON.");
    }
  }

  async generateWeeklyReport(projectId: string) {
    const snapshot = await this.fetchProjectSnapshot(projectId);
    const userPrompt = `Generate the weekly executive report for project "${snapshot.projectName}" using this data:\n\n${JSON.stringify(snapshot, null, 2)}`;

    return this.callOpenAIText(WEEKLY_REPORT_PROMPT, userPrompt);
  }

  async identifyRisks(projectId: string) {
    const snapshot = await this.fetchProjectSnapshot(projectId);
    const userPrompt = `Identify all risks in this project:\n\n${JSON.stringify(snapshot, null, 2)}`;

    const raw = await this.callOpenAI(RISK_ANALYSIS_PROMPT, userPrompt);
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("AI response was not valid JSON.");
    }
  }

  async suggestActions(projectId: string) {
    const snapshot = await this.fetchProjectSnapshot(projectId);
    const userPrompt = `Suggest follow-up actions for this project:\n\n${JSON.stringify(snapshot, null, 2)}`;

    const raw = await this.callOpenAI(ACTIONS_PROMPT, userPrompt);
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("AI response was not valid JSON.");
    }
  }
}
