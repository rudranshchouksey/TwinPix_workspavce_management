export const PIPELINE_STATUSES = [
  "NEW_LEAD",
  "CONTACTED",
  "REPLIED",
  "NEGOTIATING",
  "ACTIVE",
  "ONBOARDED",
  "BLACKLISTED",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const STATUS_META: Record<PipelineStatus, { label: string; color: string; dot: string }> = {
  NEW_LEAD: { label: "New Lead", color: "bg-sky-50 text-sky-700 border-sky-200", dot: "#0ea5e9" },
  CONTACTED: { label: "Contacted", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "#f59e0b" },
  REPLIED: { label: "Replied", color: "bg-violet-50 text-violet-700 border-violet-200", dot: "#8b5cf6" },
  NEGOTIATING: { label: "Negotiating", color: "bg-orange-50 text-orange-700 border-orange-200", dot: "#f97316" },
  ACTIVE: { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "#10b981" },
  ONBOARDED: { label: "Onboarded", color: "bg-teal-50 text-teal-700 border-teal-200", dot: "#14b8a6" },
  BLACKLISTED: { label: "Blacklisted", color: "bg-red-50 text-red-700 border-red-200", dot: "#ef4444" },
};

// Cadence (in days) before a creator in a given status is considered due for follow-up.
// Statuses that don't require active outreach (ACTIVE/ONBOARDED/BLACKLISTED) return null.
const FOLLOW_UP_CADENCE_DAYS: Partial<Record<PipelineStatus, number>> = {
  NEW_LEAD: 3,
  CONTACTED: 4,
  REPLIED: 2,
  NEGOTIATING: 2,
};

export interface NextFollowUp {
  dueDate: Date | null;
  label: string;
  overdue: boolean;
  daysUntil: number | null;
}

export function computeNextFollowUp(influencer: { status: string; lastContactDate?: string | Date | null; createdAt: string | Date }): NextFollowUp {
  const cadence = FOLLOW_UP_CADENCE_DAYS[influencer.status as PipelineStatus];
  if (!cadence) {
    return { dueDate: null, label: "—", overdue: false, daysUntil: null };
  }
  const baseline = influencer.lastContactDate ? new Date(influencer.lastContactDate) : new Date(influencer.createdAt);
  const dueDate = new Date(baseline.getTime() + cadence * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const overdue = daysUntil < 0;
  const label = overdue
    ? `Overdue ${Math.abs(daysUntil)}d`
    : daysUntil === 0
    ? "Due today"
    : `Due in ${daysUntil}d`;
  return { dueDate, label, overdue, daysUntil };
}

export interface PriorityResult {
  score: number;
  level: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
}

export function computePriority(influencer: {
  status: string;
  engagementRate?: number | null;
  followers?: number | null;
  lastContactDate?: string | Date | null;
  createdAt: string | Date;
  creatorIntelligence?: { intelligenceScore: number } | null;
  campaignCount?: number;
}): PriorityResult {
  if (influencer.status === "BLACKLISTED") {
    return { score: 0, level: "LOW", reasons: ["Blacklisted — no action needed"] };
  }
  if (influencer.status === "ACTIVE" || influencer.status === "ONBOARDED") {
    return { score: 10, level: "LOW", reasons: ["Already collaborating — monitor only"] };
  }

  let score = 0;
  const reasons: string[] = [];

  const followUp = computeNextFollowUp(influencer);
  if (followUp.overdue) {
    const days = followUp.daysUntil != null ? Math.abs(followUp.daysUntil) : 0;
    score += Math.min(40, 15 + days * 3);
    reasons.push(`Follow-up overdue by ${days}d`);
  } else if (followUp.daysUntil === 0) {
    score += 12;
    reasons.push("Follow-up due today");
  }

  if (influencer.status === "NEGOTIATING") {
    score += 20;
    reasons.push("Active negotiation");
  } else if (influencer.status === "REPLIED") {
    score += 15;
    reasons.push("Awaiting next step after reply");
  }

  if (influencer.engagementRate && influencer.engagementRate >= 4) {
    score += 15;
    reasons.push(`High engagement (${influencer.engagementRate.toFixed(1)}%)`);
  } else if (influencer.engagementRate && influencer.engagementRate >= 2.5) {
    score += 7;
  }

  if (influencer.followers && influencer.followers >= 100_000) {
    score += 10;
    reasons.push("Large audience reach");
  }

  if (influencer.creatorIntelligence?.intelligenceScore != null && influencer.creatorIntelligence.intelligenceScore >= 75) {
    score += 10;
    reasons.push("Strong AI creator score");
  }

  const level: PriorityResult["level"] = score >= 45 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";
  if (reasons.length === 0) reasons.push("No urgent signals");

  return { score: Math.min(100, score), level, reasons };
}

export const PRIORITY_META: Record<PriorityResult["level"], { label: string; color: string }> = {
  HIGH: { label: "High", color: "bg-red-50 text-red-700 border-red-200" },
  MEDIUM: { label: "Medium", color: "bg-amber-50 text-amber-700 border-amber-200" },
  LOW: { label: "Low", color: "bg-stone-100 text-stone-600 border-stone-200" },
};

export function compactNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
