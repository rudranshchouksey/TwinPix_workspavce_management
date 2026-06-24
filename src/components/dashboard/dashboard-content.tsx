"use client";

import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  TrendingUp,
  CheckCircle2,
  Clock,
  Megaphone,
  UserCircle,
  BarChart3,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { StatCard } from "./stat-card";
import { QuickAction } from "./quick-action";
import { ActivityFeed } from "./activity-feed";
import { SectionHeader } from "./section-header";
import { hasMinRole } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { formatDistanceToNow } from "date-fns";

interface DashboardContentProps {
  userName?: string;
  userRole: string;
  activities?: any[];
}

const STATS = [
  {
    label: "Total Influencers",
    value: "2,450",
    change: "+12.5% this month",
    trend: "up" as const,
    icon: <Users className="h-5 w-5 text-white/90" />,
    accent: "bg-gradient-to-br from-violet-500 to-purple-600",
    data: [100, 120, 115, 140, 135, 160, 155]
  },
  {
    label: "Active Campaigns",
    value: "14",
    change: "+2 this week",
    trend: "up" as const,
    icon: <Megaphone className="h-5 w-5 text-white/90" />,
    accent: "bg-gradient-to-br from-blue-500 to-indigo-600",
    data: [12, 12, 13, 14, 13, 14, 14]
  },
  {
    label: "Revenue Generated",
    value: "$45,200",
    change: "-4.2% from last month",
    trend: "down" as const,
    icon: <TrendingUp className="h-5 w-5 text-white/90" />,
    accent: "bg-gradient-to-br from-emerald-500 to-green-600",
    data: [40, 45, 42, 38, 41, 39, 36]
  },
  {
    label: "Tasks Completed",
    value: "128",
    change: "Steady growth",
    trend: "neutral" as const,
    icon: <CheckCircle2 className="h-5 w-5 text-white/90" />,
    accent: "bg-gradient-to-br from-orange-500 to-amber-600",
    data: [20, 22, 25, 23, 28, 26, 30]
  },
];

const ADMIN_QUICK_ACTIONS = [
  { label: "Manage Team", description: "Add members, set roles", href: "/team", icon: Users },
  { label: "Influencers", description: "Manage profiles", href: "/influencers", icon: UserCircle },
  { label: "New Campaign", description: "Launch marketing", href: "/campaigns", icon: Megaphone },
  { label: "View Analytics", description: "Performance insights", href: "/analytics", icon: BarChart3 },
];

const MEMBER_QUICK_ACTIONS = [
  { label: "My Tasks", description: "View your tasks", href: "/my-tasks", icon: CheckCircle2 },
  { label: "Projects", description: "Browse active projects", href: "/projects", icon: FolderKanban },
  { label: "View Analytics", description: "Performance insights", href: "/analytics", icon: TrendingUp },
];

const CLIENT_QUICK_ACTIONS = [
  { label: "Campaigns", description: "View your active campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Files", description: "Access shared documents", href: "/files", icon: FolderKanban },
];

function mapActivityLogToFeedItem(log: any) {
  let color = "bg-stone-100 text-stone-600 border border-stone-200";
  if (log.entityType === "CAMPAIGN") color = "bg-indigo-50 text-indigo-700 border border-indigo-100";
  else if (log.entityType === "TASK") color = "bg-emerald-50 text-emerald-700 border border-emerald-100";
  else if (log.entityType === "FILE") color = "bg-sky-50 text-sky-700 border border-sky-100";
  else if (log.entityType === "INFLUENCER") color = "bg-violet-50 text-violet-700 border border-violet-100";

  return {
    id: log.id,
    user: log.user?.name || log.userName || "Unknown User",
    action: log.action,
    target: log.targetName || log.entityType.toLowerCase(),
    time: formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }),
    color
  };
}

function getQuickActions(role: string) {
  if (hasMinRole(role, "ADMIN")) return ADMIN_QUICK_ACTIONS;
  if (hasMinRole(role, "TEAM_MEMBER")) return MEMBER_QUICK_ACTIONS;
  return CLIENT_QUICK_ACTIONS;
}

export function DashboardContent({ userName, userRole, activities = [] }: DashboardContentProps) {
  const firstName = userName?.split(" ")[0] ?? "there";
  const quickActions = getQuickActions(userRole);
  const feedItems = activities.map(mapActivityLogToFeedItem);

  return (
    <div className="space-y-10">
      {/* ── Welcome header ────────────────────────────── */}
      <PageHeader 
        title={<>Welcome back, <span className="gradient-text">{firstName}</span> 👋</>}
        description="Here's what's happening at TwinPix Studio today."
      />

      {/* ── Stats grid ─────────────────────────────────── */}
      <section aria-label="Workspace statistics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} />
          ))}
        </div>
      </section>

      {/* ── AI Insights ─────────────────────────────── */}
      <section aria-label="AI Insights">
        <div className="flex items-center gap-2 mb-4 text-[var(--color-brand-500)]">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-lg font-bold">AI Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PremiumCard hoverEffect="glow" className="flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Growth Opportunity</p>
              <h3 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">Tech Creators are trending</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">Tech creators in your roster had a 24% increase in engagement this week. Consider launching a new campaign with them.</p>
            </div>
            <div className="mt-4 flex items-center text-sm font-semibold text-[var(--color-brand-500)] cursor-pointer hover:text-[var(--color-brand-600)]">
              View Creators <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </PremiumCard>
          <PremiumCard hoverEffect="glow" className="flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Action Required</p>
              <h3 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">3 Follow-ups due today</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">You have pending follow-ups with top influencers regarding the upcoming Summer Campaign.</p>
            </div>
            <div className="mt-4 flex items-center text-sm font-semibold text-[var(--color-brand-500)] cursor-pointer hover:text-[var(--color-brand-600)]">
              View Tasks <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </PremiumCard>
        </div>
      </section>

      {/* ── Quick actions ─────────────────────────────── */}
      <section aria-label="Quick actions">
        <SectionHeader label="Quick Actions" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, i) => (
            <QuickAction key={action.label} {...action} index={i} />
          ))}
        </div>
      </section>

      {/* ── Two-column layout: Activity + Summary ──────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Activity — wider */}
        <section aria-label="Recent activity" className="xl:col-span-2">
          <SectionHeader label="Recent Activity" viewAllHref="/notifications" />
          <PremiumCard className="p-0 overflow-hidden" glass={false}>
            {feedItems.length > 0 ? (
               <ActivityFeed items={feedItems} />
            ) : (
               <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No recent activity</div>
            )}
          </PremiumCard>
        </section>

        {/* Studio Summary — narrower */}
        <section aria-label="Studio summary">
          <SectionHeader label="Studio Summary" />
          <PremiumCard hoverEffect="none" className="space-y-5">
            <SummaryItem label="Influencers" value="2,450" color="text-violet-700" bg="bg-violet-100" />
            <SummaryItem label="Active Clients" value="14" color="text-blue-700" bg="bg-blue-100" />
            <SummaryItem label="Running Campaigns" value="14" color="text-emerald-700" bg="bg-emerald-100" />
            <SummaryItem label="Pending Tasks" value="3" color="text-amber-700" bg="bg-amber-100" />
            
            <div className="border-t border-[var(--color-border)] pt-4">
              <p className="text-xs font-medium text-[var(--color-text-muted)] leading-relaxed">
                Your studio is ready to go. Start by adding influencers, creating campaigns, and inviting clients.
              </p>
            </div>
          </PremiumCard>
        </section>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, color, bg }: { label: string; value: string; color: string; bg: string; }) {
  return (
    <div className="flex items-center justify-between group cursor-default">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${bg}`}>
          <span className={`text-base font-bold ${color}`}>#</span>
        </div>
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <span className="text-base font-bold text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}
