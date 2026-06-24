const STATUS_FALLBACK_COMPLETION: Record<string, number> = {
  PLANNING: 0,
  ACTIVE: 50,
  REVIEW: 75,
  COMPLETED: 100,
  CANCELLED: 0,
};

export function getCompletionPct(campaign: any): number {
  const assignments = campaign.influencers || [];
  if (assignments.length === 0) {
    return STATUS_FALLBACK_COMPLETION[campaign.status] ?? 0;
  }
  const delivered = assignments.filter((a: any) => a.status === "DELIVERED").length;
  return Math.round((delivered / assignments.length) * 100);
}

export type Urgency = "overdue" | "urgent" | "soon" | "normal" | "none";

export function getUrgency(campaign: any): Urgency {
  if (!campaign.endDate) return "none";
  if (["COMPLETED", "CANCELLED"].includes(campaign.status)) return "none";

  const now = new Date();
  const end = new Date(campaign.endDate);
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 3) return "urgent";
  if (daysLeft <= 7) return "soon";
  return "normal";
}

export const URGENCY_COLORS: Record<Urgency, string> = {
  overdue: "#dc2626",
  urgent: "#f97316",
  soon: "#d97706",
  normal: "#d6d3d1",
  none: "transparent",
};

export function getDaysRemainingLabel(campaign: any): string | null {
  if (!campaign.endDate) return null;
  const now = new Date();
  const end = new Date(campaign.endDate);
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  if (["COMPLETED", "CANCELLED"].includes(campaign.status)) return null;
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
  if (daysLeft === 0) return "Due today";
  return `${daysLeft}d left`;
}

export function getAssignedManager(campaign: any): string | null {
  const manager = (campaign.teamMembers || []).find((tm: any) => tm.role === "MANAGER");
  return manager?.user?.name || null;
}

export function getExpectedReach(campaign: any): number {
  const seen = new Set<string>();
  let total = 0;
  for (const a of campaign.influencers || []) {
    if (seen.has(a.influencerId)) continue;
    seen.add(a.influencerId);
    total += a.influencer?.followers || 0;
  }
  return total;
}

export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export const STATUS_BADGE_STYLES: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-600 border-gray-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};
