"use client";

/**
 * components/dashboard/dashboard-content.tsx
 *
 * Main dashboard content — client component for Framer Motion.
 * Renders stat cards, quick actions, and activity feed
 * with staggered entrance animations.
 */

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
} from "lucide-react";
import { StatCard } from "./stat-card";
import { QuickAction } from "./quick-action";
import { ActivityFeed } from "./activity-feed";
import { SectionHeader } from "./section-header";
import { hasMinRole } from "@/lib/navigation";

// ─── Types ───────────────────────────────────────────────────

interface DashboardContentProps {
  userName?: string;
  userRole: string;
  activities?: any[];
}

// ─── Mock Data ───────────────────────────────────────────────

const STATS = [
  {
    label: "Team Members",
    value: "2",
    change: "Founding team",
    trend: "neutral" as const,
    icon: <Users className="h-5 w-5 text-white/90" />,
    accent: "bg-gradient-to-br from-violet-500 to-purple-600",
  },
  {
    label: "Active Campaigns",
    value: "0",
    change: "Getting started",
    trend: "neutral" as const,
    icon: <Megaphone className="h-5 w-5 text-white/90" />,
    accent: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  {
    label: "Tasks Completed",
    value: "0",
    icon: <CheckCircle2 className="h-5 w-5 text-white/90" />,
    accent: "bg-gradient-to-br from-emerald-500 to-green-600",
  },
  {
    label: "Hours Logged",
    value: "0h",
    icon: <Clock className="h-5 w-5 text-white/90" />,
    accent: "bg-gradient-to-br from-orange-500 to-amber-600",
  },
];

const ADMIN_QUICK_ACTIONS = [
  {
    label: "Manage Team",
    description: "Add members, set roles and permissions",
    href: "/team",
    icon: Users,
  },
  {
    label: "Influencers",
    description: "Manage influencer profiles & outreach",
    href: "/influencers",
    icon: UserCircle,
  },
  {
    label: "New Campaign",
    description: "Launch a new marketing campaign",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    label: "View Analytics",
    description: "Performance insights & reporting",
    href: "/analytics",
    icon: BarChart3,
  },
];

const MEMBER_QUICK_ACTIONS = [
  {
    label: "My Tasks",
    description: "View and manage your assigned tasks",
    href: "/my-tasks",
    icon: CheckCircle2,
  },
  {
    label: "Projects",
    description: "Browse active projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "View Analytics",
    description: "Performance insights & reporting",
    href: "/analytics",
    icon: TrendingUp,
  },
];

const CLIENT_QUICK_ACTIONS = [
  {
    label: "Campaigns",
    description: "View your active campaigns",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    label: "Files",
    description: "Access shared documents",
    href: "/files",
    icon: FolderKanban,
  },
];

import { formatDistanceToNow } from "date-fns";

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

// ─── Component ───────────────────────────────────────────────

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
    <div className="space-y-8">
      {/* ── Welcome header ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Welcome back,{" "}
          <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Here&apos;s what&apos;s happening at TwinPix Studio today.
        </p>
      </motion.div>

      {/* ── Stats grid ─────────────────────────────────── */}
      <section aria-label="Workspace statistics">
        <SectionHeader label="Overview" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} />
          ))}
        </div>
      </section>

      {/* ── Quick actions ─────────────────────────────── */}
      <section aria-label="Quick actions">
        <SectionHeader label="Quick Actions" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          <ActivityFeed items={feedItems} />
        </section>

        {/* Studio Summary — narrower */}
        <section aria-label="Studio summary">
          <SectionHeader label="Studio Summary" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-card space-y-4 rounded-xl p-5 shadow-sm"
          >
            <SummaryItem
              label="Influencers"
              value="0"
              color="text-violet-700"
              bg="bg-violet-100"
            />
            <SummaryItem
              label="Active Clients"
              value="0"
              color="text-blue-700"
              bg="bg-blue-100"
            />
            <SummaryItem
              label="Running Campaigns"
              value="0"
              color="text-emerald-700"
              bg="bg-emerald-100"
            />
            <SummaryItem
              label="Pending Tasks"
              value="0"
              color="text-amber-700"
              bg="bg-amber-100"
            />

            <div className="border-t border-[var(--color-border)] pt-4">
              <p className="text-xs font-medium text-[var(--color-text-muted)] leading-relaxed">
                Your studio is ready to go. Start by adding influencers,
                creating campaigns, and inviting clients.
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

// ─── Summary Item ────────────────────────────────────────────

function SummaryItem({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}
        >
          <span className={`text-sm font-bold ${color}`}>#</span>
        </div>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold text-[var(--color-text-primary)]">
        {value}
      </span>
    </div>
  );
}
